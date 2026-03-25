from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True)
class SynthesisResult:
    sample_rate: int
    output_path: Path


class TTSProvider(Protocol):
    def synthesize_to_wav(self, *, text: str, voice: str, speed: float, output_path: Path) -> SynthesisResult:
        """주어진 텍스트를 WAV 파일로 합성한다."""
