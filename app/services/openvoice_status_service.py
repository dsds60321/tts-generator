from __future__ import annotations

from pathlib import Path

from app.core.config import get_settings


class OpenVoiceStatusService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def status(self) -> dict[str, object]:
        installed = self._is_openvoice_installed()
        required_paths = {
            "converter_config": self.settings.openvoice_checkpoints_dir / "converter" / "config.json",
            "converter_checkpoint": self.settings.openvoice_checkpoints_dir / "converter" / "checkpoint.pth",
            "base_speaker_kr": self.settings.openvoice_checkpoints_dir / "base_speakers" / "ses" / "kr.pth",
        }
        missing = {key: str(path) for key, path in required_paths.items() if not path.exists()}
        return {
            "installed": installed,
            "ready": installed and not missing,
            "checkpoints_root": str(self.settings.openvoice_checkpoints_dir),
            "missing_paths": missing,
        }

    def _is_openvoice_installed(self) -> bool:
        try:
            __import__("openvoice")
            return True
        except Exception:
            return False
