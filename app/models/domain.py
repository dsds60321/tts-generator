from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AudioFormat(str, Enum):
    WAV = "wav"
    MP3 = "mp3"


class TTSMode(str, Enum):
    LITERAL = "literal"
    CONVERSATIONAL = "conversational"


class SpeakerConfig(BaseModel):
    speaker: str
    voice: str
    speed: float = 1.0
    style: str = "conversational"
    mode: TTSMode = TTSMode.CONVERSATIONAL

    @field_validator("speed")
    @classmethod
    def validate_speed(cls, value: float) -> float:
        if not 0.5 <= value <= 2.0:
            raise ValueError("speed 값은 0.5 이상 2.0 이하이어야 합니다.")
        return value


class DocumentOptions(BaseModel):
    engine: str = "melo"
    output_format: AudioFormat = AudioFormat.WAV
    default_voice: str = "KR"
    default_speed: float = 1.0
    default_style: str = "conversational"
    default_mode: TTSMode = TTSMode.CONVERSATIONAL
    normalize_spoken_text: bool = True
    sentence_split: bool = True
    pause_ms_line: int = 300
    pause_ms_paragraph: int = 700


class TTSSegment(BaseModel):
    sequence: int
    speaker: str
    raw_text: str
    processed_text: str
    voice: str
    speed: float
    style: str
    mode: TTSMode
    pause_after_ms: int = 0
    paragraph_index: int = 0
    metadata: dict[str, Any] = Field(default_factory=dict)


class TTSDocument(BaseModel):
    source_type: Literal["text", "markdown"]
    source_name: str | None = None
    original_text: str
    options: DocumentOptions
    speaker_configs: dict[str, SpeakerConfig] = Field(default_factory=dict)
    segments: list[TTSSegment] = Field(default_factory=list)
