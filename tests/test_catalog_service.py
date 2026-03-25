from __future__ import annotations

import unittest

from app.core.config import VoiceProfile
from app.services.catalog_service import CatalogService
from app.services.voice_sample_service import ReferenceVoiceSample


class CatalogServiceTest(unittest.TestCase):
    def test_list_voices_returns_runtime_unique_options_and_reference_samples(self) -> None:
        service = CatalogService()
        service.settings = type(
            "SettingsStub",
            (),
            {
                "voices": (
                    VoiceProfile(
                        key="KR_ALIAS",
                        label="KR Alias",
                        language="KR",
                        speaker_id="KR",
                        description="별칭",
                    ),
                    VoiceProfile(
                        key="KR",
                        label="KR 기본",
                        language="KR",
                        speaker_id="KR",
                        description="실제 보이스",
                    ),
                    VoiceProfile(
                        key="EN-US",
                        label="영어 보이스",
                        language="EN",
                        speaker_id="EN-US",
                        description="영어",
                    ),
                )
            },
        )()
        service.voice_sample_service = type(
            "VoiceSampleServiceStub",
            (),
            {
                "list_reference_voices": lambda self: [
                    ReferenceVoiceSample(
                        key="sample:민지",
                        label="민지",
                        language="KR",
                        description="개발자 샘플 보이스 · 민지.wav",
                        reference_path=None,  # type: ignore[arg-type]
                        base_voice="KR",
                    )
                ]
            },
        )()

        voices = service.list_voices()

        self.assertEqual(len(voices), 3)
        self.assertEqual(voices[0]["key"], "KR")
        self.assertEqual(voices[1]["key"], "EN-US")
        self.assertEqual(voices[2]["key"], "sample:민지")


if __name__ == "__main__":
    unittest.main()
