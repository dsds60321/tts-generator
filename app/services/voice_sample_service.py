from __future__ import annotations

from dataclasses import dataclass
import hashlib
from pathlib import Path
import unicodedata

from app.core.config import get_settings
from app.core.errors import ValidationAppError


@dataclass(frozen=True)
class ReferenceVoiceSample:
    key: str
    label: str
    language: str
    description: str
    reference_path: Path
    base_voice: str


class VoiceSampleService:
    PREFIX = "sample:"
    SUPPORTED_EXTENSIONS = (".wav", ".mp3", ".m4a", ".flac", ".ogg")

    def __init__(self) -> None:
        self.settings = get_settings()

    def list_reference_voices(self) -> list[ReferenceVoiceSample]:
        if not self.settings.voice_samples_dir.exists():
            return []

        voices: list[ReferenceVoiceSample] = []
        seen_keys: set[str] = set()
        for path in sorted(self.settings.voice_samples_dir.iterdir()):
            if not path.is_file() or path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
                continue

            label = self._normalize_key(path.stem.strip())
            if not label:
                continue

            key = f"{self.PREFIX}{label}"
            if key in seen_keys:
                continue
            seen_keys.add(key)

            voices.append(
                ReferenceVoiceSample(
                    key=key,
                    label=label,
                    language="KR",
                    description=f"개발자 샘플 보이스 · {path.name}",
                    reference_path=path,
                    base_voice=self.settings.default_voice,
                )
            )
        return voices

    def is_reference_voice(self, voice: str) -> bool:
        return self._normalize_key(voice).startswith(self.PREFIX)

    def get_reference_voice(self, voice: str) -> ReferenceVoiceSample:
        normalized_voice = self._normalize_key(voice)
        for item in self.list_reference_voices():
            if item.key == normalized_voice:
                return item

        available = ", ".join(sample.label for sample in self.list_reference_voices()) or "없음"
        raise ValidationAppError(
            f"샘플 보이스를 찾을 수 없습니다: `{normalized_voice}`. 현재 등록된 샘플 보이스: {available}"
        )

    def embedding_cache_path(self, sample: ReferenceVoiceSample) -> Path:
        cache_key = hashlib.sha1(sample.key.encode("utf-8")).hexdigest()[:16]
        return self.settings.voice_samples_cache_dir / f"{cache_key}.pth"

    def _normalize_key(self, value: str) -> str:
        return unicodedata.normalize("NFC", value)
