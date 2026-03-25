from __future__ import annotations

import unittest

from app.models.domain import DocumentOptions, TTSDocument
from app.models.job import JobRecord, JobStatus


class JobModelTest(unittest.TestCase):
    def test_progress_percent_is_capped_before_completion(self) -> None:
        job = JobRecord(
            job_id="job-1",
            source_type="text",
            status=JobStatus.PROCESSING,
            document=TTSDocument(
                source_type="text",
                original_text="안녕하세요",
                options=DocumentOptions(),
            ),
            segments_total=3,
            segments_completed=3,
        )
        self.assertEqual(job.progress_percent(), 99)

    def test_progress_percent_is_100_when_completed(self) -> None:
        job = JobRecord(
            job_id="job-2",
            source_type="text",
            status=JobStatus.COMPLETED,
            document=TTSDocument(
                source_type="text",
                original_text="안녕하세요",
                options=DocumentOptions(),
            ),
            segments_total=3,
            segments_completed=3,
        )
        self.assertEqual(job.progress_percent(), 100)


if __name__ == "__main__":
    unittest.main()
