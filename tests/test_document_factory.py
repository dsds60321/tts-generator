from __future__ import annotations

import unittest

from app.models.domain import AudioFormat
from app.schemas.jobs import CreateTextJobRequest
from app.services.document_factory import DocumentFactory


class DocumentFactoryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.factory = DocumentFactory()

    def test_build_text_document(self) -> None:
        document = self.factory.build_from_text(
            CreateTextJobRequest(
                text="안녕하세요. 반갑습니다.",
                output_format=AudioFormat.WAV,
                speaker="진행자",
                voice="KR",
            )
        )
        self.assertEqual(document.source_type, "text")
        self.assertEqual(document.segments[0].speaker, "진행자")
        self.assertEqual(document.options.output_format, AudioFormat.WAV)

    def test_build_markdown_document(self) -> None:
        content = """```tts
engine: melo
voice.default: KR
voice.상담원: KR_MALE
speed.상담원: 1.1
```

진행자: 안녕하세요.
상담원: 도와드리겠습니다.
"""
        document = self.factory.build_from_markdown("sample.md", content)
        self.assertEqual(document.source_type, "markdown")
        self.assertEqual(document.speaker_configs["상담원"].voice, "KR_MALE")
        self.assertGreaterEqual(len(document.segments), 2)

    def test_build_markdown_document_with_headings_and_lists(self) -> None:
        content = """```tts
engine: melo
voice.default: KR
```

# 학습 문서

- 개요 설명
1. 핵심 포인트

진행자: **안녕하세요.**
"""
        document = self.factory.build_from_markdown("컴퓨터_공학.md", content)
        processed_texts = [segment.processed_text for segment in document.segments]
        self.assertIn("학습 문서", processed_texts)
        self.assertIn("개요 설명 핵심 포인트", processed_texts)
        self.assertIn("안녕하세요.", processed_texts)

    def test_build_markdown_document_merges_consecutive_same_speaker_lines(self) -> None:
        content = """```tts
engine: melo
voice.진행자: KR
voice.학습자: KR
```

진행자:
- 첫 번째 설명입니다.
- 두 번째 설명입니다.
학습자: 질문이 있습니다.
"""
        document = self.factory.build_from_markdown("merged.md", content)
        self.assertEqual(len(document.segments), 2)
        self.assertEqual(document.segments[0].speaker, "진행자")
        self.assertEqual(
            document.segments[0].processed_text,
            "첫 번째 설명입니다. 두 번째 설명입니다.",
        )
        self.assertEqual(document.segments[1].speaker, "학습자")

    def test_build_markdown_document_skips_code_blocks_and_tables(self) -> None:
        content = """```tts
engine: melo
voice.default: KR
```

진행자:
| 항목 | 값 |
| --- | --- |
| 이름 | 홍길동 |
```python
print(1)
```
설명 문장입니다.
`print(user_id)` 는 읽지 않습니다.
"""
        document = self.factory.build_from_markdown("skip_code_and_table.md", content)
        processed_texts = [segment.processed_text for segment in document.segments]
        self.assertEqual(processed_texts, ["설명 문장입니다. 는 읽지 않습니다."])

    def test_build_markdown_document_ignores_indented_tts_block(self) -> None:
        content = """```tts
  engine: melo
  format: wav
  voice.default: KR
  speed.default: 1.3

  voice.진행자: sample:중후한_남성
  speed.진행자: 1.3

  voice.학습자: sample:발랄한_여성
  speed.학습자: 1.3
```

진행자: 첫 문장입니다.
학습자: 두 번째 문장입니다.
"""
        document = self.factory.build_from_markdown("indented_tts.md", content)

        self.assertEqual(len(document.segments), 2)
        self.assertEqual(document.speaker_configs["진행자"].voice, "sample:중후한_남성")
        self.assertEqual(document.speaker_configs["학습자"].voice, "sample:발랄한_여성")
        self.assertEqual(
            [segment.processed_text for segment in document.segments],
            ["첫 문장입니다.", "두 번째 문장입니다."],
        )

    def test_build_markdown_document_applies_speaker_override_to_bold_speaker_label(self) -> None:
        content = """```tts
engine: melo
voice.진행자: sample:중후한_남성
```

**진행자:** **안녕하세요.**
"""
        document = self.factory.build_from_markdown("bold_speaker.md", content)

        self.assertEqual(len(document.segments), 1)
        self.assertEqual(document.segments[0].speaker, "진행자")
        self.assertEqual(document.segments[0].voice, "sample:중후한_남성")
        self.assertEqual(document.segments[0].processed_text, "안녕하세요.")


if __name__ == "__main__":
    unittest.main()
