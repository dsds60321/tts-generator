from __future__ import annotations

from app.core.errors import ValidationAppError
from app.providers.melo_provider import MeloTTSProvider
from app.providers.openvoice_provider import OpenVoiceProvider
from app.services.voice_sample_service import VoiceSampleService


class ProviderFactory:
    def __init__(self) -> None:
        self.voice_sample_service = VoiceSampleService()
        self._melo_provider = MeloTTSProvider()
        self._openvoice_provider = OpenVoiceProvider(
            base_provider=self._melo_provider,
            voice_sample_service=self.voice_sample_service,
        )

    def get(self, engine: str, voice: str):
        if self.voice_sample_service.is_reference_voice(voice):
            return self._openvoice_provider
        if engine == "melo":
            return self._melo_provider
        raise ValidationAppError(f"지원하지 않는 engine 입니다: `{engine}`")
