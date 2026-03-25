from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from app.services.voice_sample_service import VoiceSampleService


class VoiceSampleServiceTest(unittest.TestCase):
    def test_list_reference_voices_uses_file_name_as_label(self) -> None:
        service = VoiceSampleService()
        with TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            (root / "민지.wav").write_bytes(b"sample")
            (root / "상담원.mp3").write_bytes(b"sample")
            (root / "README.txt").write_text("ignore", encoding="utf-8")

            service.settings = type(
                "SettingsStub",
                (),
                {
                    "voice_samples_dir": root,
                    "voice_samples_cache_dir": root / ".cache",
                    "default_voice": "KR",
                },
            )()

            voices = service.list_reference_voices()

        self.assertEqual([item.label for item in voices], ["민지", "상담원"])
        self.assertEqual([item.key for item in voices], ["sample:민지", "sample:상담원"])

    def test_embedding_cache_path_is_stable(self) -> None:
        service = VoiceSampleService()
        with TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            cache_dir = root / ".cache"
            (root / "민지.wav").write_bytes(b"sample")

            service.settings = type(
                "SettingsStub",
                (),
                {
                    "voice_samples_dir": root,
                    "voice_samples_cache_dir": cache_dir,
                    "default_voice": "KR",
                },
            )()

            voice = service.get_reference_voice("sample:민지")
            first = service.embedding_cache_path(voice)
            second = service.embedding_cache_path(voice)

        self.assertEqual(first, second)
        self.assertEqual(first.suffix, ".pth")
        self.assertEqual(first.parent.name, ".cache")
