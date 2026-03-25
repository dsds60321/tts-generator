from __future__ import annotations

import unittest

from app.models.domain import TTSMode
from app.services.text_preprocessor import TextPreprocessor


class TextPreprocessorTest(unittest.TestCase):
    def setUp(self) -> None:
        self.preprocessor = TextPreprocessor()

    def test_sentence_split_and_normalization(self) -> None:
        chunks = self.preprocessor.preprocess(
            "안녕하세요...   반갑습니다!  문의는 support@example.com 으로 주세요.",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
            sentence_split=True,
            final_pause_ms=300,
        )
        self.assertGreaterEqual(len(chunks), 1)
        self.assertIn("골뱅이", " ".join(chunk.text for chunk in chunks))

    def test_sentence_split_merges_short_sentences_within_limit(self) -> None:
        chunks = self.preprocessor.preprocess(
            "첫 번째 문장입니다. 두 번째 문장도 이어집니다.",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
            sentence_split=True,
            final_pause_ms=300,
        )
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0].text, "첫 번째 문장입니다. 두 번째 문장도 이어집니다.")

    def test_literal_mode_keeps_basic_text_shape(self) -> None:
        normalized = self.preprocessor.normalize(
            "문장  하나   입니다.",
            mode=TTSMode.LITERAL,
            normalize_spoken_text=False,
        )
        self.assertEqual(normalized, "문장 하나 입니다.")

    def test_markdown_syntax_is_converted_to_spoken_text(self) -> None:
        normalized = self.preprocessor.normalize(
            "# **제목**\n- `학습자`가 _답_을 생각한다.\n1. 정의 → 원리",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
        )
        self.assertEqual(normalized, "제목\n학습자가 답을 생각한다.\n정의 다음 원리")

    def test_code_like_inline_backticks_are_dropped(self) -> None:
        normalized = self.preprocessor.normalize(
            "설명 앞 `print(user_id)` 설명 뒤",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
        )
        self.assertEqual(normalized, "설명 앞 설명 뒤")

    def test_markdown_divider_is_dropped(self) -> None:
        chunks = self.preprocessor.preprocess(
            "---",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
            sentence_split=True,
            final_pause_ms=300,
        )
        self.assertEqual(chunks, [])

    def test_fenced_code_block_is_dropped(self) -> None:
        normalized = self.preprocessor.normalize(
            "```python\nprint(1)\nvalue = x + y\n```\n설명 문장",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
        )
        self.assertEqual(normalized, "설명 문장")

    def test_markdown_table_is_dropped(self) -> None:
        normalized = self.preprocessor.normalize(
            "| 항목 | 값 |\n| --- | --- |\n| 이름 | 홍길동 |\n설명 문장",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
        )
        self.assertEqual(normalized, "설명 문장")

    def test_special_symbols_are_normalized_for_tts(self) -> None:
        normalized = self.preprocessor.normalize(
            "B-Tree & B+Tree / C++ <test>",
            mode=TTSMode.CONVERSATIONAL,
            normalize_spoken_text=True,
        )
        self.assertEqual(normalized, "B-Tree 그리고 B 플러스 Tree 슬래시 C 플러스 플러스 test")


if __name__ == "__main__":
    unittest.main()
