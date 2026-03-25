from __future__ import annotations

from app.core.config import get_settings
from app.models.domain import AudioFormat, DocumentOptions, SpeakerConfig, TTSDocument, TTSSegment
from app.parsers.markdown_parser import MarkdownParser, ParsedMarkdownLine
from app.schemas.jobs import CreateTextJobRequest
from app.services.text_preprocessor import TextPreprocessor


class DocumentFactory:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.markdown_parser = MarkdownParser()
        self.text_preprocessor = TextPreprocessor()

    def build_from_text(self, request: CreateTextJobRequest) -> TTSDocument:
        options = DocumentOptions(
            engine=self.settings.default_engine,
            output_format=request.output_format,
            default_voice=request.voice,
            default_speed=request.speed,
            default_style=request.style,
            default_mode=request.mode,
            normalize_spoken_text=request.normalize_spoken_text,
            sentence_split=request.sentence_split,
            pause_ms_line=self.settings.default_pause_ms_line,
            pause_ms_paragraph=self.settings.default_pause_ms_paragraph,
        )

        speaker_config = SpeakerConfig(
            speaker=request.speaker,
            voice=request.voice,
            speed=request.speed,
            style=request.style,
            mode=request.mode,
        )
        segments = self._build_text_segments(request.text, speaker_config, options)
        return TTSDocument(
            source_type="text",
            original_text=request.text,
            options=options,
            speaker_configs={request.speaker: speaker_config},
            segments=segments,
        )

    def build_from_markdown(self, file_name: str, content: str) -> TTSDocument:
        parsed = self.markdown_parser.parse(content)
        options = DocumentOptions(
            engine=str(parsed.options.get("engine", self.settings.default_engine)),
            output_format=AudioFormat(str(parsed.options.get("output_format", self.settings.default_format))),
            default_voice=str(parsed.options.get("default_voice", self.settings.default_voice)),
            default_speed=float(parsed.options.get("default_speed", self.settings.default_speed)),
            default_style=str(parsed.options.get("default_style", self.settings.default_style)),
            default_mode=parsed.options.get("default_mode", self.settings.default_mode),
            normalize_spoken_text=bool(parsed.options.get("normalize_spoken_text", True)),
            sentence_split=bool(parsed.options.get("sentence_split", True)),
            pause_ms_line=int(parsed.options.get("pause_ms_line", self.settings.default_pause_ms_line)),
            pause_ms_paragraph=int(parsed.options.get("pause_ms_paragraph", self.settings.default_pause_ms_paragraph)),
        )

        speaker_configs: dict[str, SpeakerConfig] = {
            "기본": SpeakerConfig(
                speaker="기본",
                voice=options.default_voice,
                speed=options.default_speed,
                style=options.default_style,
                mode=options.default_mode,
            )
        }

        for speaker, overrides in parsed.speaker_overrides.items():
            speaker_configs[speaker] = SpeakerConfig(
                speaker=speaker,
                voice=str(overrides.get("voice", options.default_voice)),
                speed=float(overrides.get("speed", options.default_speed)),
                style=str(overrides.get("style", options.default_style)),
                mode=overrides.get("mode", options.default_mode),
            )

        segments: list[TTSSegment] = []
        sequence = 1
        merged_lines = self._merge_markdown_lines(parsed.lines)
        for line in merged_lines:
            config = speaker_configs.get(line.speaker, speaker_configs["기본"])
            chunks = self.text_preprocessor.preprocess(
                line.text,
                mode=config.mode,
                normalize_spoken_text=options.normalize_spoken_text,
                sentence_split=options.sentence_split,
                final_pause_ms=line.pause_after_ms,
            )
            for chunk in chunks:
                segments.append(
                    TTSSegment(
                        sequence=sequence,
                        speaker=line.speaker,
                        raw_text=line.text,
                        processed_text=chunk.text,
                        voice=config.voice,
                        speed=config.speed,
                        style=config.style,
                        mode=config.mode,
                        pause_after_ms=chunk.pause_after_ms,
                        paragraph_index=line.paragraph_index,
                        metadata={"line_number": line.line_number},
                    )
                )
                sequence += 1

        return TTSDocument(
            source_type="markdown",
            source_name=file_name,
            original_text=content,
            options=options,
            speaker_configs=speaker_configs,
            segments=segments,
        )

    def _build_text_segments(
        self,
        text: str,
        config: SpeakerConfig,
        options: DocumentOptions,
    ) -> list[TTSSegment]:
        segments: list[TTSSegment] = []
        sequence = 1
        paragraphs = text.replace("\r\n", "\n").split("\n\n")
        for paragraph_index, paragraph in enumerate(paragraphs):
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            lines = [line.strip() for line in paragraph.splitlines() if line.strip()]
            for line_index, line in enumerate(lines):
                is_last_line = paragraph_index == len(paragraphs) - 1 and line_index == len(lines) - 1
                final_pause = 0 if is_last_line else options.pause_ms_paragraph
                if line_index < len(lines) - 1:
                    final_pause = options.pause_ms_line
                chunks = self.text_preprocessor.preprocess(
                    line,
                    mode=config.mode,
                    normalize_spoken_text=options.normalize_spoken_text,
                    sentence_split=options.sentence_split,
                    final_pause_ms=final_pause,
                )
                for chunk in chunks:
                    segments.append(
                        TTSSegment(
                            sequence=sequence,
                            speaker=config.speaker,
                            raw_text=line,
                            processed_text=chunk.text,
                            voice=config.voice,
                            speed=config.speed,
                            style=config.style,
                            mode=config.mode,
                            pause_after_ms=chunk.pause_after_ms,
                            paragraph_index=paragraph_index,
                        )
                    )
                    sequence += 1
        return segments

    def _merge_markdown_lines(self, lines: list[ParsedMarkdownLine]) -> list[ParsedMarkdownLine]:
        if not lines:
            return []

        merged: list[ParsedMarkdownLine] = []
        current = lines[0]

        for line in lines[1:]:
            if line.speaker == current.speaker and line.paragraph_index == current.paragraph_index:
                current = ParsedMarkdownLine(
                    speaker=current.speaker,
                    text=f"{current.text}\n{line.text}".strip(),
                    paragraph_index=current.paragraph_index,
                    pause_after_ms=line.pause_after_ms,
                    line_number=current.line_number,
                )
                continue
            merged.append(current)
            current = line

        merged.append(current)
        return merged
