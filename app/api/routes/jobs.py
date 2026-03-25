from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.errors import ValidationAppError
from app.models.job import JobRecord
from app.schemas.jobs import (
    CreateTextJobRequest,
    JobResponse,
    OpenVoiceStatusResponse,
    VoiceOptionResponse,
)
from app.services.catalog_service import CatalogService
from app.services.job_service import JobService
from app.services.openvoice_status_service import OpenVoiceStatusService

router = APIRouter(tags=["jobs"])

job_service = JobService()
catalog_service = CatalogService()
openvoice_status_service = OpenVoiceStatusService()


def serialize_job(job: JobRecord) -> JobResponse:
    return JobResponse(
        job_id=job.job_id,
        status=job.status,
        stage=job.stage,
        source_type=job.source_type,
        requested_format=job.requested_format,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
        segments_total=job.segments_total,
        segments_completed=job.segments_completed,
        progress_percent=job.progress_percent(),
        output=job.output,
        error=job.error,
    )


@router.get("/voices", response_model=list[VoiceOptionResponse])
async def list_voices() -> list[VoiceOptionResponse]:
    return [VoiceOptionResponse.model_validate(item) for item in catalog_service.list_voices()]


@router.get("/openvoice/status", response_model=OpenVoiceStatusResponse)
async def get_openvoice_status() -> OpenVoiceStatusResponse:
    return OpenVoiceStatusResponse.model_validate(openvoice_status_service.status())


@router.post("/jobs/text", response_model=JobResponse)
async def create_text_job(request: CreateTextJobRequest) -> JobResponse:
    job = job_service.create_text_job(request)
    return serialize_job(job)


@router.post("/jobs/markdown", response_model=JobResponse)
async def create_markdown_job(file: UploadFile = File(...)) -> JobResponse:
    if not file.filename or not file.filename.lower().endswith(".md"):
        raise ValidationAppError("Markdown 업로드는 `.md` 파일만 지원합니다.")
    raw = await file.read()
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValidationAppError("Markdown 파일은 UTF-8 인코딩만 지원합니다.") from exc
    job = await job_service.create_markdown_job(file_name=file.filename, content=content)
    return serialize_job(job)


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str) -> JobResponse:
    return serialize_job(job_service.get_job(job_id))


@router.get("/jobs/{job_id}/download")
async def download_output(job_id: str) -> FileResponse:
    job = job_service.get_job(job_id)
    if job.output is None:
        raise ValidationAppError("아직 다운로드 가능한 출력 파일이 없습니다.")
    output_path = Path(job.output.file_path)
    if not output_path.exists():
        job_service.delete_job_output(job_id)
        raise ValidationAppError("다운로드 가능한 결과 파일이 이미 삭제되었습니다. 다시 생성해 주세요.")
    return FileResponse(
        path=str(output_path),
        filename=job.output.file_name,
        background=BackgroundTask(job_service.delete_job_output, job_id),
    )
