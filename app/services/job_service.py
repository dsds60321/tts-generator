from __future__ import annotations

import asyncio
from pathlib import Path
import shutil
from uuid import uuid4

from app.core.errors import AppError
from app.models.job import JobArtifact, JobError, JobRecord, JobStage, JobStatus
from app.schemas.jobs import CreateTextJobRequest
from app.services.audio_service import AudioService
from app.services.document_factory import DocumentFactory
from app.services.job_store import JobStore
from app.services.provider_factory import ProviderFactory
from app.services.storage_service import StorageService


class JobService:
    def __init__(self) -> None:
        self.storage_service = StorageService()
        self.job_store = JobStore(self.storage_service)
        self.document_factory = DocumentFactory()
        self.provider_factory = ProviderFactory()
        self.audio_service = AudioService()
        self._tasks: dict[str, asyncio.Task[None]] = {}

    def create_text_job(self, request: CreateTextJobRequest) -> JobRecord:
        document = self.document_factory.build_from_text(request)
        job = self._create_job(source_type="text", document=document)
        self._schedule(job.job_id)
        return job

    async def create_markdown_job(self, *, file_name: str, content: str) -> JobRecord:
        document = self.document_factory.build_from_markdown(file_name, content)
        job = self._create_job(source_type="markdown", document=document)
        self._schedule(job.job_id)
        return job

    def get_job(self, job_id: str) -> JobRecord:
        job = self.job_store.get(job_id)
        updated = False
        if job.error is not None and job.error.code == "unexpected_error":
            job.error = JobError(
                code="unexpected_error",
                message="음성 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            )
            updated = True
        if job.output is not None and not Path(job.output.file_path).exists():
            job.output = None
            updated = True
        if updated:
            job.touch()
            self.job_store.save(job)
        return job

    def delete_job_output(self, job_id: str) -> None:
        job = self.job_store.get(job_id)
        self.storage_service.remove_job_output(job_id)
        self.storage_service.remove_job_uploads(job_id)
        if job.output is None:
            return
        job.output = None
        job.touch()
        self.job_store.save(job)

    def _create_job(self, *, source_type: str, document) -> JobRecord:
        job = JobRecord(
            job_id=uuid4().hex,
            source_type=source_type,
            requested_format=document.options.output_format,
            document=document,
            segments_total=len(document.segments),
        )
        self.job_store.save(job)
        return job

    def _schedule(self, job_id: str) -> None:
        task = asyncio.create_task(self._process_job_async(job_id))
        self._tasks[job_id] = task

    async def _process_job_async(self, job_id: str) -> None:
        try:
            await asyncio.to_thread(self._process_job_sync, job_id)
        finally:
            self._tasks.pop(job_id, None)

    def _process_job_sync(self, job_id: str) -> None:
        job = self.job_store.get(job_id)
        try:
            self._update_job(job, status=JobStatus.PROCESSING, stage=JobStage.GENERATING)
            self.storage_service.ensure_job_dirs(job_id)
            segment_paths: list[tuple[Path, int]] = []

            for index, segment in enumerate(job.document.segments, start=1):
                provider = self.provider_factory.get(job.document.options.engine, segment.voice)
                segment_path = self.storage_service.job_segments_dir(job_id) / f"{segment.sequence:04d}.wav"
                provider.synthesize_to_wav(
                    text=segment.processed_text,
                    voice=segment.voice,
                    speed=segment.speed,
                    output_path=segment_path,
                )
                self.audio_service.normalize_wav_segment(segment_path)
                segment_paths.append((segment_path, segment.pause_after_ms))
                job.segments_completed = index
                self.job_store.save(job)

            self._update_job(job, stage=JobStage.MERGING)
            merged_wav = self.storage_service.job_output_dir(job_id) / f"{job_id}.wav"
            self.audio_service.merge_wav_segments(segment_paths, merged_wav)

            final_path = merged_wav
            if job.requested_format.value == "mp3":
                self._update_job(job, stage=JobStage.CONVERTING)
                final_path = self.storage_service.job_output_dir(job_id) / f"{job_id}.mp3"
                self.audio_service.convert_wav_to_mp3(merged_wav, final_path)
                merged_wav.unlink(missing_ok=True)

            shutil.rmtree(self.storage_service.job_segments_dir(job_id), ignore_errors=True)
            job.output = JobArtifact(
                format=job.requested_format,
                file_path=str(final_path),
                file_name=final_path.name,
            )
            self._update_job(job, status=JobStatus.COMPLETED, stage=JobStage.COMPLETED)
        except AppError as exc:
            self._fail_job(job, exc.code, exc.message)
        except Exception as exc:  # pragma: no cover - 예기치 않은 실패 보호막
            self._fail_job(job, "unexpected_error", "음성 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")

    def _update_job(
        self,
        job: JobRecord,
        *,
        status: JobStatus | None = None,
        stage: JobStage | None = None,
    ) -> None:
        if status is not None:
            job.status = status
        if stage is not None:
            job.stage = stage
        job.touch()
        self.job_store.save(job)

    def _fail_job(self, job: JobRecord, code: str, message: str) -> None:
        self.storage_service.remove_job_output(job.job_id)
        self.storage_service.remove_job_uploads(job.job_id)
        job.status = JobStatus.FAILED
        job.stage = JobStage.FAILED
        job.error = JobError(code=code, message=message)
        job.output = None
        job.touch()
        self.job_store.save(job)
