from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from app.services.openvoice_status_service import OpenVoiceStatusService


class OpenVoiceStatusServiceTest(unittest.TestCase):
    def test_status_reports_missing_checkpoints(self) -> None:
        service = OpenVoiceStatusService()
        with TemporaryDirectory() as tmp_dir:
            checkpoints_root = Path(tmp_dir) / "checkpoints_v2"
            checkpoints_root.mkdir(parents=True, exist_ok=True)
            service.settings = type(
                "SettingsStub",
                (),
                {
                    "openvoice_checkpoints_dir": checkpoints_root,
                },
            )()

            status = service.status()

        self.assertIn("converter_config", status["missing_paths"])
        self.assertIn("converter_checkpoint", status["missing_paths"])
        self.assertIn("base_speaker_kr", status["missing_paths"])


if __name__ == "__main__":
    unittest.main()
