from __future__ import annotations


class AppError(Exception):
    def __init__(self, message: str, *, status_code: int = 400, code: str = "app_error") -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class ValidationAppError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=422, code="validation_error")


class JobNotFoundError(AppError):
    def __init__(self, job_id: str) -> None:
        super().__init__(f"Job `{job_id}` 를 찾을 수 없습니다.", status_code=404, code="job_not_found")


class ProviderUnavailableError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=503, code="provider_unavailable")


class GenerationFailedError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=500, code="generation_failed")
