from __future__ import annotations

from pathlib import Path
import shutil

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def job_file_path(self, job_id: str) -> Path:
        return self.settings.jobs_dir / f"{job_id}.json"

    def job_output_dir(self, job_id: str) -> Path:
        return self.settings.outputs_dir / job_id

    def job_segments_dir(self, job_id: str) -> Path:
        return self.job_output_dir(job_id) / "segments"

    def upload_path(self, job_id: str, file_name: str) -> Path:
        safe_name = Path(file_name).name
        return self.settings.uploads_dir / f"{job_id}_{safe_name}"

    def ensure_job_dirs(self, job_id: str) -> None:
        self.job_output_dir(job_id).mkdir(parents=True, exist_ok=True)
        self.job_segments_dir(job_id).mkdir(parents=True, exist_ok=True)

    def remove_job_output(self, job_id: str) -> None:
        shutil.rmtree(self.job_output_dir(job_id), ignore_errors=True)

    def remove_job_uploads(self, job_id: str) -> None:
        for path in self.settings.uploads_dir.glob(f"{job_id}_*"):
            path.unlink(missing_ok=True)
