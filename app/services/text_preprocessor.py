from __future__ import annotations

import re

from pydantic import BaseModel

from app.core.config import get_settings
from app.models.domain import TTSMode


class PreprocessedChunk(BaseModel):
    text: str
    pause_after_ms: int


class TextPreprocessor:
    _heading_pattern = re.compile(r"^\s{0,3}#{1,6}\s+")
    _blockquote_pattern = re.compile(r"^\s{0,3}>\s?")
    _unordered_list_pattern = re.compile(r"^\s{0,3}[-*+]\s+")
    _ordered_list_pattern = re.compile(r"^\s{0,3}\d+[.)]\s+")
    _task_list_pattern = re.compile(r"^\s{0,3}[-*+]\s+\[[ xX]\]\s+")
    _horizontal_rule_pattern = re.compile(r"^\s{0,3}(?:[-*_]\s*){3,}$")
    _fenced_code_pattern = re.compile(r"^\s*```")
    _table_separator_pattern = re.compile(r"^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$")
    _inline_code_like_pattern = re.compile(r"[0-9_=+*/\\<>{}\[\]()]")
    _unsupported_symbol_pattern = re.compile(r"[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\s\n.,!?\"'()/:;,\-]")

    def __init__(self) -> None:
        self.settings = get_settings()

    def preprocess(
        self,
        text: str,
        *,
        mode: TTSMode,
        normalize_spoken_text: bool,
        sentence_split: bool,
        final_pause_ms: int,
    ) -> list[PreprocessedChunk]:
        normalized = self.normalize(text, mode=mode, normalize_spoken_text=normalize_spoken_text)
        if not normalized:
            return []

        chunks = [normalized]
        if sentence_split:
            chunks = self._split_sentences(normalized)
            chunks = self._merge_short_chunks(chunks)

        expanded: list[str] = []
        for chunk in chunks:
            expanded.extend(self._split_long_chunk(chunk))

        results: list[PreprocessedChunk] = []
        for index, chunk in enumerate(expanded):
            pause_after_ms = final_pause_ms if index == len(expanded) - 1 else self.settings.default_pause_ms_sentence
            results.append(PreprocessedChunk(text=chunk, pause_after_ms=pause_after_ms))
        return results

    def normalize(self, text: str, *, mode: TTSMode, normalize_spoken_text: bool) -> str:
        value = text.replace("\r\n", "\n")
        value = self._normalize_markdown(value)
        value = re.sub(r"[ \t]+", " ", value)
        value = re.sub(r"\n{3,}", "\n\n", value)
        value = re.sub(r"\s+([,.!?])", r"\1", value)
        value = value.strip()

        if normalize_spoken_text:
            replacements = {
                "&": " 그리고 ",
                "%": " 퍼센트",
                "@": " 골뱅이 ",
                "…": ". ",
                "→": " 다음 ",
                "+": " 플러스 ",
                "=": " 이콜 ",
                "_": " ",
            }
            for source, target in replacements.items():
                value = value.replace(source, target)
            value = value.replace("/", " 슬래시 ")
            value = value.replace("\\", " 백슬래시 ")
            value = re.sub(r"[|]+", " ", value)
            value = re.sub(r"[<>{}\\[\\]^~]", " ", value)
            value = self._unsupported_symbol_pattern.sub(" ", value)
            value = re.sub(r"[“”]", '"', value)
            value = re.sub(r"[‘’]", "'", value)

        if mode == TTSMode.CONVERSATIONAL:
            value = re.sub(r"\s*[,;:]\s*", ", ", value)
            value = re.sub(r"\s{2,}", " ", value)

        value = re.sub(r" {2,}", " ", value)
        value = re.sub(r" *\n *", "\n", value)

        return value.strip()

    def _normalize_markdown(self, text: str) -> str:
        normalized_lines: list[str] = []
        raw_lines = text.split("\n")
        in_fenced_code = False

        for index, raw_line in enumerate(raw_lines):
            stripped = raw_line.strip()
            if not stripped:
                normalized_lines.append("")
                continue

            if self._fenced_code_pattern.match(stripped):
                in_fenced_code = not in_fenced_code
                continue
            if in_fenced_code:
                continue
            if self._horizontal_rule_pattern.fullmatch(stripped):
                continue
            if self._is_markdown_table_row(stripped, raw_lines, index):
                continue

            line = self._heading_pattern.sub("", raw_line)
            line = self._blockquote_pattern.sub("", line)
            line = self._task_list_pattern.sub("", line)
            line = self._unordered_list_pattern.sub("", line)
            line = self._ordered_list_pattern.sub("", line)
            line = self._normalize_inline_markdown(line)
            normalized_lines.append(line.strip())

        return "\n".join(normalized_lines)

    def _normalize_inline_markdown(self, text: str) -> str:
        value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", text)
        value = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r"\1", value)
        value = re.sub(r"`([^`]+)`", self._replace_inline_code, value)
        value = value.replace("`", "")
        value = re.sub(r"\*\*(.*?)\*\*", r"\1", value)
        value = re.sub(r"__(.*?)__", r"\1", value)
        value = re.sub(r"~~(.*?)~~", r"\1", value)
        value = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"\1", value)
        value = re.sub(r"(?<!_)_([^_]+)_(?!_)", r"\1", value)
        return value

    def _replace_inline_code(self, match: re.Match[str]) -> str:
        value = match.group(1).strip()
        if not value:
            return ""
        if self._inline_code_like_pattern.search(value):
            return ""
        return value

    def _is_markdown_table_row(self, stripped: str, raw_lines: list[str], index: int) -> bool:
        if self._table_separator_pattern.fullmatch(stripped):
            return True
        if "|" not in stripped:
            return False

        previous = raw_lines[index - 1].strip() if index > 0 else ""
        next_line = raw_lines[index + 1].strip() if index + 1 < len(raw_lines) else ""
        return bool(
            self._table_separator_pattern.fullmatch(previous)
            or self._table_separator_pattern.fullmatch(next_line)
        )

    def _split_sentences(self, text: str) -> list[str]:
        parts = re.split(r"(?<=[.!?])\s+|\n+", text)
        return [part.strip() for part in parts if part.strip()]

    def _merge_short_chunks(self, chunks: list[str]) -> list[str]:
        if not chunks:
            return []

        merged: list[str] = []
        current = chunks[0]
        for chunk in chunks[1:]:
            candidate = f"{current} {chunk}".strip()
            if len(candidate) <= self.settings.max_chunk_chars:
                current = candidate
                continue
            merged.append(current)
            current = chunk
        merged.append(current)
        return merged

    def _split_long_chunk(self, text: str) -> list[str]:
        if len(text) <= self.settings.max_chunk_chars:
            return [text]

        delimiters = [", ", "; ", ": ", " "]
        chunks = [text]
        for delimiter in delimiters:
            next_chunks: list[str] = []
            changed = False
            for chunk in chunks:
                if len(chunk) <= self.settings.max_chunk_chars:
                    next_chunks.append(chunk)
                    continue
                pieces = self._pack_by_delimiter(chunk, delimiter)
                if len(pieces) > 1:
                    changed = True
                next_chunks.extend(pieces)
            chunks = next_chunks
            if all(len(chunk) <= self.settings.max_chunk_chars for chunk in chunks):
                break
            if changed:
                continue

        finalized: list[str] = []
        for chunk in chunks:
            if len(chunk) <= self.settings.max_chunk_chars:
                finalized.append(chunk)
                continue
            start = 0
            while start < len(chunk):
                finalized.append(chunk[start : start + self.settings.max_chunk_chars].strip())
                start += self.settings.max_chunk_chars
        return [chunk for chunk in finalized if chunk]

    def _pack_by_delimiter(self, text: str, delimiter: str) -> list[str]:
        if delimiter not in text:
            return [text]
        parts = text.split(delimiter)
        result: list[str] = []
        current = ""
        for part in parts:
            candidate = f"{current}{delimiter if current else ''}{part}".strip()
            if len(candidate) <= self.settings.max_chunk_chars:
                current = candidate
                continue
            if current:
                result.append(current)
            current = part.strip()
        if current:
            result.append(current)
        return result or [text]
