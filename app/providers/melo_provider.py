from __future__ import annotations

import os
from pathlib import Path
from importlib.machinery import ModuleSpec
import sys
import types
from typing import Any

from app.core.config import VoiceProfile, get_settings
from app.core.errors import GenerationFailedError, ProviderUnavailableError, ValidationAppError
from app.providers.base import SynthesisResult, TTSProvider


class MeloTTSProvider(TTSProvider):
    _HF_MODEL_IDS_BY_LANGUAGE: dict[str, tuple[str, ...]] = {
        "KR": (
            "myshell-ai/MeloTTS-Korean",
            "kykim/bert-kor-base",
            "bert-base-uncased",
            "tohoku-nlp/bert-base-japanese-v3",
        ),
    }

    def __init__(self) -> None:
        self.settings = get_settings()
        self._models: dict[str, Any] = {}
        self._voice_map: dict[str, VoiceProfile] = {voice.key: voice for voice in self.settings.voices}

    def synthesize_to_wav(self, *, text: str, voice: str, speed: float, output_path: Path) -> SynthesisResult:
        profile = self._resolve_voice(voice)
        model = self._get_model(profile.language)
        speaker_ids = getattr(model.hps.data, "spk2id", {})
        speaker_key = self._resolve_speaker_key(profile.speaker_id, speaker_ids)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            model.tts_to_file(text, speaker_ids[speaker_key], str(output_path), speed=speed, quiet=True)
        except KeyError as exc:
            raise GenerationFailedError(
                "음성 생성 중 읽을 수 없는 문자나 기호가 포함되어 작업이 중단되었습니다. "
                "특수문자를 정리한 뒤 다시 시도해 주세요."
            ) from exc
        except IndexError as exc:
            raise GenerationFailedError(
                "음성 생성 중 텍스트 전처리 오류가 발생했습니다. "
                "제목, 목록, 특수문자를 정리한 뒤 다시 시도해 주세요."
            ) from exc
        except Exception as exc:
            raise GenerationFailedError(
                "음성 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
            ) from exc
        sample_rate = int(getattr(model.hps.data, "sampling_rate", 44100))
        return SynthesisResult(sample_rate=sample_rate, output_path=output_path)

    def _resolve_voice(self, voice: str) -> VoiceProfile:
        profile = self._voice_map.get(voice)
        if profile is None:
            supported = ", ".join(sorted(self._voice_map))
            raise ValidationAppError(f"지원하지 않는 voice 값입니다: `{voice}`. 사용 가능 값: {supported}")
        return profile

    def _get_model(self, language: str) -> Any:
        if language in self._models:
            return self._models[language]

        try:
            self._install_runtime_shims(language)
            from melo.api import TTS
        except ImportError as exc:
            raise ProviderUnavailableError(
                "MeloTTS가 설치되어 있지 않습니다. `pip install -e .[melo]` 또는 "
                "`pip install git+https://github.com/myshell-ai/MeloTTS.git` 후 다시 시도해 주세요."
            ) from exc

        model = TTS(language=language, device=self.settings.melo_device)
        self._models[language] = model
        return model

    def _resolve_speaker_key(self, configured: str, speaker_ids: dict[str, int]) -> str:
        candidates = (
            configured,
            configured.replace("_", "-"),
            configured.replace("-", "_"),
            configured.upper(),
        )
        for candidate in candidates:
            if candidate in speaker_ids:
                return candidate
        available = ", ".join(sorted(speaker_ids))
        raise ValidationAppError(
            f"MeloTTS speaker id `{configured}` 를 찾지 못했습니다. 사용 가능한 speaker: {available}"
        )

    def _install_runtime_shims(self, language: str) -> None:
        # MeloTTS의 한국어 경로는 g2pkk가 `mecab` 모듈을 기대하고,
        # import 시 일본어 모듈도 함께 로드되므로 최소 호환 shim 이 필요하다.
        os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
        self._configure_huggingface_runtime(language)
        self._install_korean_mecab_shim()
        self._install_japanese_mecab_shim()

    def _configure_huggingface_runtime(self, language: str, cache_root: Path | None = None) -> None:
        if os.getenv("MELO_ALLOW_REMOTE_LOOKUPS") == "1":
            return

        required_models = self._HF_MODEL_IDS_BY_LANGUAGE.get(language, ())
        if not required_models:
            return

        resolved_cache_root = cache_root or self._resolve_huggingface_cache_root()
        if all(self._is_huggingface_model_cached(resolved_cache_root, model_id) for model_id in required_models):
            os.environ.setdefault("HF_HUB_OFFLINE", "1")
            os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
            os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

    def _resolve_huggingface_cache_root(self) -> Path:
        configured_home = os.getenv("HF_HOME")
        if configured_home:
            return Path(configured_home) / "hub"
        return Path.home() / ".cache" / "huggingface" / "hub"

    def _is_huggingface_model_cached(self, cache_root: Path, model_id: str) -> bool:
        snapshots_dir = cache_root / self._huggingface_model_cache_name(model_id) / "snapshots"
        return snapshots_dir.is_dir() and any(child.is_dir() for child in snapshots_dir.iterdir())

    def _huggingface_model_cache_name(self, model_id: str) -> str:
        return f"models--{model_id.replace('/', '--')}"

    def _install_korean_mecab_shim(self) -> None:
        if "mecab" in sys.modules:
            return

        try:
            __import__("mecab")
            return
        except ImportError:
            pass

        try:
            import _mecab
            import mecab_ko_dic
        except ImportError as exc:
            raise ProviderUnavailableError(
                "한국어 MeloTTS 실행에 필요한 `python-mecab-ko` 가 설치되어 있지 않습니다. "
                "`pip install -e .[melo]` 를 다시 실행해 주세요."
            ) from exc

        module = types.ModuleType("mecab")

        class CompatMeCab:
            def __init__(self) -> None:
                site_packages = Path(mecab_ko_dic.__file__).resolve().parent.parent
                rc_path = site_packages / "MeCab" / "mecabrc"
                options = ["--rcfile", str(rc_path), "--dicdir", str(mecab_ko_dic.dictionary_path)]
                self._tagger = _mecab.Tagger(options)

            def pos(self, sentence: str) -> list[tuple[str, str]]:
                lattice = _mecab.Lattice()
                lattice.add_request_type(_mecab.MECAB_ALLOCATE_SENTENCE)
                lattice.set_sentence(sentence)
                if not self._tagger.parse(lattice):
                    return []

                pairs: list[tuple[str, str]] = []
                node = lattice.bos_node()
                while node is not None:
                    surface = getattr(node, "surface", "")
                    feature = getattr(node, "feature", "")
                    stat = getattr(node, "stat", None)
                    if surface and stat == 0:
                        pairs.append((surface, feature.split(",")[0]))
                    node = node.next
                return pairs

        module.MeCab = CompatMeCab
        module.__all__ = ["MeCab"]
        module.__spec__ = ModuleSpec(name="mecab", loader=None)
        sys.modules["mecab"] = module

    def _install_japanese_mecab_shim(self) -> None:
        class CompatTagger:
            def parse(self, _: str) -> str:
                raise RuntimeError(
                    "현재 환경의 MeloTTS MVP는 한국어 경로만 보장합니다. 일본어 보이스는 아직 지원하지 않습니다."
                )

        try:
            import MeCab as mecab_module

            if not hasattr(mecab_module, "Tagger"):
                mecab_module.Tagger = CompatTagger
            return
        except Exception:
            pass

        module = types.ModuleType("MeCab")
        module.Tagger = CompatTagger
        module.__spec__ = ModuleSpec(name="MeCab", loader=None)
        sys.modules["MeCab"] = module
