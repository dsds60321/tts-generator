from __future__ import annotations

from app.core.config import get_settings
from app.services.voice_sample_service import VoiceSampleService


class CatalogService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.voice_sample_service = VoiceSampleService()

    def list_voices(self) -> list[dict[str, str]]:
        # UI에는 실제로 구분 가능한 runtime voice 만 노출한다.
        # 현재 MeloTTS 한국어 모델은 `KR` speaker 하나만 제공하므로
        # `KR_FEMALE`, `KR_MALE` 같은 별칭은 목록에서 합쳐 보여준다.
        unique_voices: dict[tuple[str, str], dict[str, str]] = {}

        for voice in self.settings.voices:
            runtime_key = (voice.language, voice.speaker_id)
            payload = {
                "key": voice.key,
                "label": voice.label,
                "language": voice.language,
                "description": voice.description,
            }
            current = unique_voices.get(runtime_key)
            if current is None or voice.key == voice.speaker_id:
                unique_voices[runtime_key] = payload

        system_voices = list(unique_voices.values())
        sample_voices = [
            {
                "key": sample.key,
                "label": sample.label,
                "language": sample.language,
                "description": sample.description,
            }
            for sample in self.voice_sample_service.list_reference_voices()
        ]
        return [*system_voices, *sample_voices]
