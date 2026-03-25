from __future__ import annotations

import json

from app.core.errors import JobNotFoundError
from app.models.job import JobRecord
from app.services.storage_service import StorageService


class JobStore:
    def __init__(self, storage_service: StorageService) -> None:
        self.storage_service = storage_service

    def save(self, job: JobRecord) -> JobRecord:
        path = self.storage_service.job_file_path(job.job_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(job.model_dump_json(indent=2), encoding="utf-8")
        return job

    def get(self, job_id: str) -> JobRecord:
        path = self.storage_service.job_file_path(job_id)
        if not path.exists():
            raise JobNotFoundError(job_id)
        payload = json.loads(path.read_text(encoding="utf-8"))
        return JobRecord.model_validate(payload)
