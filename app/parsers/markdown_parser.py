from __future__ import annotations

from dataclasses import dataclass, field
import re

from app.core.errors import ValidationAppError
from app.models.domain import AudioFormat, TTSMode


@dataclass
class ParsedMarkdownLine:
    speaker: str
    text: str
    paragraph_index: int
    pause_after_ms: int
    line_number: int


@dataclass
class ParsedMarkdown:
    options: dict[str, object] = field(default_factory=dict)
    speaker_overrides: dict[str, dict[str, object]] = field(default_factory=dict)
    lines: list[ParsedMarkdownLine] = field(default_factory=list)


class MarkdownParser:
    _speaker_pattern = re.compile(r"^(?P<speaker>[^:：]{1,40})\s*[:：]\s*(?P<text>.+)$")
    _speaker_only_pattern = re.compile(r"^(?P<speaker>[^:：]{1,40})\s*[:：]\s*$")
    _styled_speaker_pattern = re.compile(
        r"^(?P<marker>\*\*|__|\*|_|~~|`)\s*(?P<speaker>[^:：]{1,40}?)\s*(?:(?P=marker)\s*[:：]|[:：](?P=marker))\s*(?P<text>.+)$"
    )
    _styled_speaker_only_pattern = re.compile(
        r"^(?P<marker>\*\*|__|\*|_|~~|`)\s*(?P<speaker>[^:：]{1,40}?)\s*(?:(?P=marker)\s*[:：]|[:：](?P=marker))\s*$"
    )
    _unordered_list_pattern = re.compile(r"^\s{0,3}[-*+]\s+")
    _ordered_list_pattern = re.compile(r"^\s{0,3}\d+[.)]\s+")

    def parse(self, content: str) -> ParsedMarkdown:
        normalized = content.replace("\r\n", "\n").replace("\ufeff", "")
        config_block, body = self._extract_tts_block(normalized)
        parsed = ParsedMarkdown()
        if config_block is not None:
            parsed.options, parsed.speaker_overrides = self._parse_config(config_block)
        parsed.lines = self._parse_body(body, parsed.options)
        if not parsed.lines:
            raise ValidationAppError("Markdown 본문에서 읽을 텍스트를 찾지 못했습니다.")
        return parsed

    def _extract_tts_block(self, content: str) -> tuple[str | None, str]:
        stripped = content.lstrip()
        if not stripped.startswith("```tts"):
            return None, content

        lines = content.split("\n")
        start_index = None
        for index, line in enumerate(lines):
            if line.strip():
                start_index = index
                break
        if start_index is None or not lines[start_index].strip().startswith("```tts"):
            return None, content

        for end_index in range(start_index + 1, len(lines)):
            if lines[end_index].strip() == "```":
                block = "\n".join(lines[start_index + 1 : end_index])
                body = "\n".join(lines[end_index + 1 :])
                return block, body

        raise ValidationAppError("Markdown 상단 `tts` 코드 블록이 닫히지 않았습니다.")

    def _parse_config(self, block: str) -> tuple[dict[str, object], dict[str, dict[str, object]]]:
        options: dict[str, object] = {}
        speaker_overrides: dict[str, dict[str, object]] = {}

        for raw_index, line in enumerate(block.splitlines(), start=1):
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if ":" not in stripped:
                raise ValidationAppError(f"`tts` 설정 {raw_index}번째 줄은 `key: value` 형식이어야 합니다.")
            key, raw_value = stripped.split(":", 1)
            key = key.strip()
            value = raw_value.strip()
            if not value:
                raise ValidationAppError(f"`{key}` 설정 값이 비어 있습니다.")
            self._apply_config_value(key, value, options, speaker_overrides)

        return options, speaker_overrides

    def _apply_config_value(
        self,
        key: str,
        value: str,
        options: dict[str, object],
        speaker_overrides: dict[str, dict[str, object]],
    ) -> None:
        if key == "engine":
            if value != "melo":
                raise ValidationAppError("현재 MVP에서는 `engine: melo` 만 지원합니다.")
            options["engine"] = value
            return
        if key == "format":
            lowered = value.lower()
            if lowered not in {AudioFormat.WAV.value, AudioFormat.MP3.value}:
                raise ValidationAppError("format 값은 `wav` 또는 `mp3` 여야 합니다.")
            options["output_format"] = lowered
            return
        if key == "normalize_spoken_text":
            options["normalize_spoken_text"] = self._parse_bool(value, key)
            return
        if key == "sentence_split":
            options["sentence_split"] = self._parse_bool(value, key)
            return
        if key == "pause_ms.line":
            options["pause_ms_line"] = self._parse_int(value, key)
            return
        if key == "pause_ms.paragraph":
            options["pause_ms_paragraph"] = self._parse_int(value, key)
            return
        if key == "voice.default":
            options["default_voice"] = value
            return
        if key == "speed.default":
            options["default_speed"] = self._parse_speed(value, key)
            return
        if key == "style.default":
            options["default_style"] = value
            options.setdefault("default_mode", self._parse_mode(value))
            return
        if key == "mode.default":
            options["default_mode"] = self._parse_mode(value)
            return
        if key.startswith("voice."):
            speaker = key.removeprefix("voice.")
            speaker_overrides.setdefault(speaker, {})["voice"] = value
            return
        if key.startswith("speed."):
            speaker = key.removeprefix("speed.")
            speaker_overrides.setdefault(speaker, {})["speed"] = self._parse_speed(value, key)
            return
        if key.startswith("style."):
            speaker = key.removeprefix("style.")
            speaker_overrides.setdefault(speaker, {})["style"] = value
            speaker_overrides[speaker].setdefault("mode", self._parse_mode(value))
            return
        if key.startswith("mode."):
            speaker = key.removeprefix("mode.")
            speaker_overrides.setdefault(speaker, {})["mode"] = self._parse_mode(value)
            return

        raise ValidationAppError(f"지원하지 않는 `tts` 설정 키입니다: `{key}`")

    def _parse_bool(self, value: str, key: str) -> bool:
        lowered = value.lower()
        if lowered in {"true", "yes", "1"}:
            return True
        if lowered in {"false", "no", "0"}:
            return False
        raise ValidationAppError(f"`{key}` 값은 true/false 여야 합니다.")

    def _parse_int(self, value: str, key: str) -> int:
        try:
            parsed = int(value)
        except ValueError as exc:
            raise ValidationAppError(f"`{key}` 값은 정수여야 합니다.") from exc
        if parsed < 0:
            raise ValidationAppError(f"`{key}` 값은 0 이상이어야 합니다.")
        return parsed

    def _parse_speed(self, value: str, key: str) -> float:
        try:
            parsed = float(value)
        except ValueError as exc:
            raise ValidationAppError(f"`{key}` 값은 숫자여야 합니다.") from exc
        if not 0.5 <= parsed <= 2.0:
            raise ValidationAppError(f"`{key}` 값은 0.5 이상 2.0 이하이어야 합니다.")
        return parsed

    def _parse_mode(self, value: str) -> str:
        lowered = value.lower()
        if lowered in {TTSMode.LITERAL.value, TTSMode.CONVERSATIONAL.value}:
            return lowered
        raise ValidationAppError("mode/style 값은 `literal` 또는 `conversational` 이어야 합니다.")

    def _parse_body(self, body: str, options: dict[str, object]) -> list[ParsedMarkdownLine]:
        pause_line = int(options.get("pause_ms_line", 300))
        pause_paragraph = int(options.get("pause_ms_paragraph", 700))
        lines: list[ParsedMarkdownLine] = []
        current_speaker = "기본"
        paragraph_index = 0
        body_lines = body.splitlines()

        for index, raw_line in enumerate(body_lines, start=1):
            stripped = raw_line.strip()
            if not stripped:
                paragraph_index += 1
                continue

            is_list_item = bool(
                self._unordered_list_pattern.match(raw_line) or self._ordered_list_pattern.match(raw_line)
            )

            speaker_only = None if is_list_item else self._parse_speaker_only_line(stripped)
            if speaker_only is not None:
                current_speaker = speaker_only
                continue

            parsed_line = None if is_list_item else self._parse_speaker_line(stripped)
            if parsed_line is not None:
                current_speaker, text = parsed_line
            else:
                text = stripped

            next_line = body_lines[index] if index < len(body_lines) else ""
            pause_after_ms = pause_paragraph if not next_line.strip() else pause_line
            lines.append(
                ParsedMarkdownLine(
                    speaker=current_speaker,
                    text=text,
                    paragraph_index=paragraph_index,
                    pause_after_ms=pause_after_ms,
                    line_number=index,
                )
            )

        return lines

    def _parse_speaker_line(self, stripped: str) -> tuple[str, str] | None:
        styled_match = self._styled_speaker_pattern.match(stripped)
        if styled_match:
            return (
                styled_match.group("speaker").strip(),
                styled_match.group("text").strip(),
            )

        match = self._speaker_pattern.match(stripped)
        if match:
            return (
                match.group("speaker").strip(),
                match.group("text").strip(),
            )
        return None

    def _parse_speaker_only_line(self, stripped: str) -> str | None:
        styled_match = self._styled_speaker_only_pattern.match(stripped)
        if styled_match:
            return styled_match.group("speaker").strip()

        match = self._speaker_only_pattern.match(stripped)
        if match:
            return match.group("speaker").strip()
        return None
