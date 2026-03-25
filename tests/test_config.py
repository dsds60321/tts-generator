from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
import os
import unittest

from app.core.config import PROJECT_ROOT, get_settings


class SettingsTest(unittest.TestCase):
    def test_default_storage_paths_are_resolved_from_project_root(self) -> None:
        original_cwd = Path.cwd()
        get_settings.cache_clear()
        try:
            with TemporaryDirectory() as tmp_dir:
                os.chdir(tmp_dir)

                settings = get_settings()

                self.assertEqual(settings.project_root, PROJECT_ROOT)
                self.assertEqual(settings.storage_root, PROJECT_ROOT / "storage")
                self.assertEqual(settings.voice_samples_dir, PROJECT_ROOT / "storage" / "voice_samples")
                self.assertEqual(
                    settings.openvoice_checkpoints_dir,
                    PROJECT_ROOT / "storage" / "models" / "openvoice" / "checkpoints_v2",
                )
        finally:
            os.chdir(original_cwd)
            get_settings.cache_clear()


if __name__ == "__main__":
    unittest.main()
