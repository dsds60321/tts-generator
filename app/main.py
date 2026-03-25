from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.jobs import router as jobs_router
from app.core.config import get_settings
from app.core.errors import AppError

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Markdown 및 일반 텍스트를 입력받아 화자별 음성을 생성하는 웹 TTS API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "message": exc.message})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(jobs_router, prefix=settings.api_prefix)
