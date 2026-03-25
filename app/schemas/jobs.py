from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.models.domain import AudioFormat, TTSMode
from app.models.job import JobArtifact, JobError, JobStage, JobStatus


class CreateTextJobRequest(BaseModel):
    text: str = Field(min_length=1)
    output_format: AudioFormat = AudioFormat.WAV
    speaker: str = "기본"
    voice: str = "KR"
    speed: float = 1.0
    style: str = "conversational"
    mode: TTSMode = TTSMode.CONVERSATIONAL
    normalize_spoken_text: bool = True
    sentence_split: bool = True

    @field_validator("speed")
    @classmethod
    def validate_speed(cls, value: float) -> float:
        if not 0.5 <= value <= 2.0:
            raise ValueError("speed 값은 0.5 이상 2.0 이하이어야 합니다.")
        return value


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    stage: JobStage
    source_type: str
    requested_format: AudioFormat
    created_at: str
    updated_at: str
    segments_total: int
    segments_completed: int
    progress_percent: int
    output: JobArtifact | None = None
    error: JobError | None = None


class VoiceOptionResponse(BaseModel):
    key: str
    label: str
    language: str
    description: str


class OpenVoiceStatusResponse(BaseModel):
    installed: bool
    ready: bool
    checkpoints_root: str
    missing_paths: dict[str, str]
