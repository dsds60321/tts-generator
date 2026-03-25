from __future__ import annotations

import asyncio
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from app.models.domain import AudioFormat
from app.models.job import JobArtifact
from app.services.job_service import JobService


class JobServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.job_service = JobService()
        self.temp_dir = Path(tempfile.mkdtemp(prefix="job-service-test-"))
        self.test_settings = type(
            "SettingsStub",
            (),
            {
                "jobs_dir": self.temp_dir / "jobs",
                "outputs_dir": self.temp_dir / "outputs",
                "uploads_dir": self.temp_dir / "uploads",
            },
        )()
        self.test_settings.jobs_dir.mkdir(parents=True, exist_ok=True)
        self.test_settings.outputs_dir.mkdir(parents=True, exist_ok=True)
        self.test_settings.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.job_service.storage_service.settings = self.test_settings

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_create_markdown_job_does_not_persist_uploaded_markdown(self) -> None:
        content = """```tts
engine: melo
voice.default: KR
```

진행자: 업로드 원문은 저장하지 않습니다.
"""

        with patch.object(self.job_service, "_schedule", return_value=None):
            job = asyncio.run(self.job_service.create_markdown_job(file_name="sample.md", content=content))

        upload_path = self.job_service.storage_service.upload_path(job.job_id, "sample.md")
        self.assertEqual(job.source_type, "markdown")
        self.assertEqual(job.document.original_text, content)
        self.assertFalse(upload_path.exists())
        self.assertTrue(self.job_service.storage_service.job_file_path(job.job_id).exists())

    def test_delete_job_output_also_removes_legacy_uploaded_markdown(self) -> None:
        content = """```tts
engine: melo
voice.default: KR
```

진행자: 레거시 업로드 파일도 함께 정리합니다.
"""
        document = self.job_service.document_factory.build_from_markdown("legacy.md", content)
        job = self.job_service._create_job(source_type="markdown", document=document)

        output_dir = self.job_service.storage_service.job_output_dir(job.job_id)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{job.job_id}.wav"
        output_path.write_bytes(b"RIFF")

        upload_path = self.job_service.storage_service.upload_path(job.job_id, "legacy.md")
        upload_path.write_text(content, encoding="utf-8")

        job.output = JobArtifact(
            format=AudioFormat.WAV,
            file_path=str(output_path),
            file_name=output_path.name,
        )
        self.job_service.job_store.save(job)

        self.job_service.delete_job_output(job.job_id)

        saved_job = self.job_service.job_store.get(job.job_id)
        self.assertFalse(output_dir.exists())
        self.assertFalse(upload_path.exists())
        self.assertIsNone(saved_job.output)


if __name__ == "__main__":
    unittest.main()
