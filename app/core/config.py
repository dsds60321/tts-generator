from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


@dataclass(frozen=True)
class VoiceProfile:
    key: str
    label: str
    language: str
    speaker_id: str
    description: str


VOICE_CATALOG: tuple[VoiceProfile, ...] = (
    VoiceProfile(
        key="KR",
        label="KR 기본",
        language="KR",
        speaker_id="KR",
        description="MeloTTS 공식 한국어 기본 보이스",
    ),
    VoiceProfile(
        key="KR_FEMALE",
        label="KR Female",
        language="KR",
        speaker_id="KR",
        description="현재 MVP에서는 MeloTTS 한국어 기본 보이스로 매핑되는 별칭",
    ),
    VoiceProfile(
        key="KR_MALE",
        label="KR Male",
        language="KR",
        speaker_id="KR",
        description="현재 MVP에서는 MeloTTS 한국어 기본 보이스로 매핑되는 별칭",
    ),
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
STORAGE_ROOT = PROJECT_ROOT / "storage"


@dataclass(frozen=True)
class Settings:
    app_name: str = "TTS Generator"
    api_prefix: str = "/api/v1"
    project_root: Path = PROJECT_ROOT
    storage_root: Path = STORAGE_ROOT
    uploads_dir: Path = STORAGE_ROOT / "uploads"
    jobs_dir: Path = STORAGE_ROOT / "jobs"
    outputs_dir: Path = STORAGE_ROOT / "outputs"
    voice_samples_dir: Path = STORAGE_ROOT / "voice_samples"
    voice_samples_cache_dir: Path = STORAGE_ROOT / "voice_samples" / ".cache"
    models_dir: Path = STORAGE_ROOT / "models"
    openvoice_checkpoints_dir: Path = STORAGE_ROOT / "models" / "openvoice" / "checkpoints_v2"
    supported_formats: tuple[str, ...] = ("wav", "mp3")
    default_engine: str = "melo"
    default_format: str = "wav"
    default_voice: str = "KR"
    default_speed: float = 1.0
    default_style: str = "conversational"
    default_mode: str = "conversational"
    default_pause_ms_line: int = 300
    default_pause_ms_paragraph: int = 700
    default_pause_ms_sentence: int = 140
    max_speed: float = 2.0
    min_speed: float = 0.5
    max_chunk_chars: int = 400
    internal_wav_sample_rate: int = 22050
    internal_wav_channels: int = 1
    internal_wav_sample_width_bytes: int = 2
    melo_device: str = os.getenv("MELO_DEVICE", "auto")
    openvoice_device: str = os.getenv("OPENVOICE_DEVICE", "auto")
    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    )
    voices: tuple[VoiceProfile, ...] = VOICE_CATALOG


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.jobs_dir.mkdir(parents=True, exist_ok=True)
    settings.outputs_dir.mkdir(parents=True, exist_ok=True)
    settings.voice_samples_dir.mkdir(parents=True, exist_ok=True)
    settings.voice_samples_cache_dir.mkdir(parents=True, exist_ok=True)
    settings.models_dir.mkdir(parents=True, exist_ok=True)
    return settings
