from __future__ import annotations

from pathlib import Path
from importlib.machinery import ModuleSpec
import sys
import types
from typing import Any

from app.core.config import get_settings
from app.core.errors import ProviderUnavailableError
from app.providers.base import SynthesisResult, TTSProvider
from app.providers.melo_provider import MeloTTSProvider
from app.services.voice_sample_service import ReferenceVoiceSample, VoiceSampleService


class OpenVoiceProvider(TTSProvider):
    def __init__(
        self,
        *,
        base_provider: MeloTTSProvider | None = None,
        voice_sample_service: VoiceSampleService | None = None,
    ) -> None:
        self.settings = get_settings()
        self.base_provider = base_provider or MeloTTSProvider()
        self.voice_sample_service = voice_sample_service or VoiceSampleService()
        self._converter: Any | None = None
        self._source_embeddings: dict[str, Any] = {}
        self._target_embeddings: dict[str, Any] = {}

    def synthesize_to_wav(self, *, text: str, voice: str, speed: float, output_path: Path) -> SynthesisResult:
        sample = self.voice_sample_service.get_reference_voice(voice)
        temp_wav = output_path.with_name(f"{output_path.stem}.base.wav")
        base_result = self.base_provider.synthesize_to_wav(
            text=text,
            voice=sample.base_voice,
            speed=speed,
            output_path=temp_wav,
        )
        try:
            self._convert_to_reference_voice(sample=sample, source_wav=temp_wav, output_path=output_path)
        finally:
            temp_wav.unlink(missing_ok=True)
        return SynthesisResult(sample_rate=base_result.sample_rate, output_path=output_path)

    def _convert_to_reference_voice(
        self,
        *,
        sample: ReferenceVoiceSample,
        source_wav: Path,
        output_path: Path,
    ) -> None:
        converter, torch = self._get_converter_and_torch()
        source_embedding = self._get_source_embedding(sample.base_voice, torch, converter.device)
        target_embedding = self._get_target_embedding(sample, converter, torch)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        converter.convert(
            audio_src_path=str(source_wav),
            src_se=source_embedding,
            tgt_se=target_embedding,
            output_path=str(output_path),
            message="tts-generator",
        )

    def _get_converter_and_torch(self) -> tuple[Any, Any]:
        try:
            self._install_runtime_shims()
            import torch
            from openvoice.api import ToneColorConverter
        except ImportError as exc:
            raise ProviderUnavailableError(
                "샘플 보이스를 사용하려면 OpenVoice가 필요합니다. "
                "`pip install --no-deps git+https://github.com/myshell-ai/OpenVoice.git` 후 다시 시도해 주세요."
            ) from exc

        if self._converter is not None:
            return (self._converter, torch)

        converter_dir = self.settings.openvoice_checkpoints_dir / "converter"
        config_path = converter_dir / "config.json"
        checkpoint_path = converter_dir / "checkpoint.pth"
        if not config_path.exists() or not checkpoint_path.exists():
            raise ProviderUnavailableError(
                "OpenVoice V2 체크포인트가 없습니다. "
                f"`{self.settings.openvoice_checkpoints_dir}` 아래에 `converter/config.json`, "
                "`converter/checkpoint.pth`, `base_speakers/ses/*.pth` 를 배치해 주세요."
            )

        self._converter = ToneColorConverter(
            str(config_path),
            device=self._resolve_openvoice_device(torch),
        )
        self._converter.load_ckpt(str(checkpoint_path))
        self._converter.watermark_model = None
        return self._converter, torch

    def _resolve_openvoice_device(self, torch: Any) -> str:
        configured = self.settings.openvoice_device
        if configured != "auto":
            return configured
        if torch.cuda.is_available():
            return "cuda:0"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    def _get_source_embedding(self, base_voice: str, torch: Any, device: str) -> Any:
        speaker_key = base_voice.lower().replace("_", "-")
        if speaker_key in self._source_embeddings:
            return self._source_embeddings[speaker_key]

        source_path = self.settings.openvoice_checkpoints_dir / "base_speakers" / "ses" / f"{speaker_key}.pth"
        if not source_path.exists():
            raise ProviderUnavailableError(
                "OpenVoice base speaker embedding 이 없습니다. "
                f"`{source_path}` 파일을 확인해 주세요."
            )

        source_embedding = torch.load(str(source_path), map_location=device)
        if hasattr(source_embedding, "to"):
            source_embedding = source_embedding.to(device)
        self._source_embeddings[speaker_key] = source_embedding
        return source_embedding

    def _get_target_embedding(self, sample: ReferenceVoiceSample, converter: Any, torch: Any) -> Any:
        if sample.key in self._target_embeddings:
            return self._target_embeddings[sample.key]

        cache_path = self.voice_sample_service.embedding_cache_path(sample)
        if cache_path.exists():
            target_embedding = torch.load(str(cache_path), map_location=converter.device)
            if hasattr(target_embedding, "to"):
                target_embedding = target_embedding.to(converter.device)
        else:
            target_embedding = converter.extract_se(
                [str(sample.reference_path)],
                se_save_path=str(cache_path),
            )

        self._target_embeddings[sample.key] = target_embedding
        return target_embedding

    def _install_runtime_shims(self) -> None:
        self._install_wavmark_shim()

    def _install_wavmark_shim(self) -> None:
        if "wavmark" in sys.modules:
            return

        module = types.ModuleType("wavmark")

        class DummyWatermarkModel:
            def to(self, _device: str) -> "DummyWatermarkModel":
                return self

        def load_model() -> DummyWatermarkModel:
            return DummyWatermarkModel()

        module.load_model = load_model
        module.__spec__ = ModuleSpec(name="wavmark", loader=None)
        sys.modules["wavmark"] = module
