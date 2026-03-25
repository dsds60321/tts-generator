from __future__ import annotations

from pathlib import Path
import subprocess
import wave

from app.core.config import get_settings
from app.core.errors import GenerationFailedError


class AudioService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def merge_wav_segments(self, segments: list[tuple[Path, int]], output_path: Path) -> None:
        if not segments:
            raise GenerationFailedError("병합할 오디오 segment 가 없습니다.")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with wave.open(str(segments[0][0]), "rb") as first_reader:
            params = first_reader.getparams()

        with wave.open(str(output_path), "wb") as writer:
            writer.setparams(params)
            for index, (segment_path, pause_after_ms) in enumerate(segments):
                with wave.open(str(segment_path), "rb") as reader:
                    current = reader.getparams()
                    if (
                        current.nchannels != params.nchannels
                        or current.sampwidth != params.sampwidth
                        or current.framerate != params.framerate
                    ):
                        raise GenerationFailedError("WAV segment 간 오디오 포맷이 달라 병합할 수 없습니다.")
                    writer.writeframes(reader.readframes(reader.getnframes()))

                if index < len(segments) - 1:
                    self._write_silence(
                        writer,
                        params.framerate,
                        params.nchannels,
                        params.sampwidth,
                        pause_after_ms,
                    )

    def convert_wav_to_mp3(self, wav_path: Path, mp3_path: Path) -> None:
        mp3_path.parent.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", str(wav_path), str(mp3_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise GenerationFailedError(
                "ffmpeg 로 mp3 변환에 실패했습니다. "
                f"stderr: {result.stderr.strip() or '출력 없음'}"
            )

    def normalize_wav_segment(self, wav_path: Path) -> None:
        if self._is_target_wav_format(wav_path):
            return

        normalized_path = wav_path.with_name(f"{wav_path.stem}.normalized.wav")
        result = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(wav_path),
                "-ac",
                str(self.settings.internal_wav_channels),
                "-ar",
                str(self.settings.internal_wav_sample_rate),
                "-sample_fmt",
                "s16",
                "-acodec",
                "pcm_s16le",
                str(normalized_path),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            normalized_path.unlink(missing_ok=True)
            raise GenerationFailedError(
                "WAV segment 포맷 정규화에 실패했습니다. "
                f"stderr: {result.stderr.strip() or '출력 없음'}"
            )
        normalized_path.replace(wav_path)

    def _write_silence(
        self,
        writer: wave.Wave_write,
        sample_rate: int,
        channels: int,
        sample_width: int,
        duration_ms: int,
    ) -> None:
        if duration_ms <= 0:
            return
        frame_count = int(sample_rate * (duration_ms / 1000))
        silence = b"\x00" * frame_count * channels * sample_width
        writer.writeframes(silence)

    def _is_target_wav_format(self, wav_path: Path) -> bool:
        with wave.open(str(wav_path), "rb") as reader:
            params = reader.getparams()
        return (
            params.nchannels == self.settings.internal_wav_channels
            and params.sampwidth == self.settings.internal_wav_sample_width_bytes
            and params.framerate == self.settings.internal_wav_sample_rate
        )
