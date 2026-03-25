from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

from app.models.domain import AudioFormat, TTSDocument


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobStage(str, Enum):
    QUEUED = "queued"
    PARSING = "parsing"
    GENERATING = "generating"
    MERGING = "merging"
    CONVERTING = "converting"
    COMPLETED = "completed"
    FAILED = "failed"


class JobArtifact(BaseModel):
    format: AudioFormat
    file_path: str
    file_name: str


class JobError(BaseModel):
    code: str
    message: str


class JobRecord(BaseModel):
    job_id: str
    source_type: str
    status: JobStatus = JobStatus.QUEUED
    stage: JobStage = JobStage.QUEUED
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    requested_format: AudioFormat = AudioFormat.WAV
    output: JobArtifact | None = None
    document: TTSDocument
    segments_total: int = 0
    segments_completed: int = 0
    error: JobError | None = None

    def touch(self) -> None:
        self.updated_at = utc_now()

    def progress_percent(self) -> int:
        if self.status == JobStatus.COMPLETED:
            return 100
        if self.segments_total <= 0:
            return 0
        percent = int((self.segments_completed / self.segments_total) * 100)
        if self.status == JobStatus.PROCESSING:
            return min(percent, 99)
        return min(percent, 100)
