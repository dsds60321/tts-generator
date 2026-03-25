from __future__ import annotations

from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
import wave

from app.services.audio_service import AudioService


class AudioServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.audio_service = AudioService()
        self.temp_dir = Path(tempfile.mkdtemp(prefix="audio-service-test-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_normalize_wav_segment_skips_target_format(self) -> None:
        wav_path = self.temp_dir / "target.wav"
        self._write_wav(
            wav_path,
            channels=self.audio_service.settings.internal_wav_channels,
            sample_width=self.audio_service.settings.internal_wav_sample_width_bytes,
            sample_rate=self.audio_service.settings.internal_wav_sample_rate,
        )

        with patch("app.services.audio_service.subprocess.run") as mocked_run:
            self.audio_service.normalize_wav_segment(wav_path)

        mocked_run.assert_not_called()
        with wave.open(str(wav_path), "rb") as reader:
            self.assertEqual(reader.getframerate(), self.audio_service.settings.internal_wav_sample_rate)

    def test_normalize_wav_segment_converts_mismatched_rate(self) -> None:
        wav_path = self.temp_dir / "source.wav"
        self._write_wav(
            wav_path,
            channels=1,
            sample_width=2,
            sample_rate=44100,
        )

        def fake_run(args: list[str], **_: object):
            output_path = Path(args[-1])
            self._write_wav(
                output_path,
                channels=self.audio_service.settings.internal_wav_channels,
                sample_width=self.audio_service.settings.internal_wav_sample_width_bytes,
                sample_rate=self.audio_service.settings.internal_wav_sample_rate,
            )

            class Result:
                returncode = 0
                stderr = ""

            return Result()

        with patch("app.services.audio_service.subprocess.run", side_effect=fake_run) as mocked_run:
            self.audio_service.normalize_wav_segment(wav_path)

        mocked_run.assert_called_once()
        with wave.open(str(wav_path), "rb") as reader:
            self.assertEqual(reader.getnchannels(), self.audio_service.settings.internal_wav_channels)
            self.assertEqual(reader.getsampwidth(), self.audio_service.settings.internal_wav_sample_width_bytes)
            self.assertEqual(reader.getframerate(), self.audio_service.settings.internal_wav_sample_rate)

    def test_merge_wav_segments_concatenates_each_segment_once(self) -> None:
        segment_paths: list[tuple[Path, int]] = []
        frame_sizes = [100, 200, 300]

        for index, frame_count in enumerate(frame_sizes, start=1):
            wav_path = self.temp_dir / f"{index:04d}.wav"
            self._write_wav(
                wav_path,
                channels=self.audio_service.settings.internal_wav_channels,
                sample_width=self.audio_service.settings.internal_wav_sample_width_bytes,
                sample_rate=self.audio_service.settings.internal_wav_sample_rate,
                frame_count=frame_count,
                fill_byte=index,
            )
            segment_paths.append((wav_path, 0))

        output_path = self.temp_dir / "merged.wav"
        self.audio_service.merge_wav_segments(segment_paths, output_path)

        frame_width = (
            self.audio_service.settings.internal_wav_channels
            * self.audio_service.settings.internal_wav_sample_width_bytes
        )
        with wave.open(str(output_path), "rb") as reader:
            self.assertEqual(reader.getnframes(), sum(frame_sizes))
            frames = reader.readframes(reader.getnframes())

        decoded = [frames[offset : offset + frame_width] for offset in range(0, len(frames), frame_width)]
        self.assertTrue(all(frame == b"\x01\x01" for frame in decoded[:100]))
        self.assertTrue(all(frame == b"\x02\x02" for frame in decoded[100:300]))
        self.assertTrue(all(frame == b"\x03\x03" for frame in decoded[300:600]))

    def _write_wav(
        self,
        path: Path,
        *,
        channels: int,
        sample_width: int,
        sample_rate: int,
        frame_count: int | None = None,
        fill_byte: int = 0,
    ) -> None:
        resolved_frame_count = frame_count or sample_rate // 10
        payload = bytes([fill_byte]) * resolved_frame_count * channels * sample_width
        with wave.open(str(path), "wb") as writer:
            writer.setnchannels(channels)
            writer.setsampwidth(sample_width)
            writer.setframerate(sample_rate)
            writer.writeframes(payload)


if __name__ == "__main__":
    unittest.main()
