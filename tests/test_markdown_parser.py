from __future__ import annotations

import unittest

from app.parsers.markdown_parser import MarkdownParser


class MarkdownParserTest(unittest.TestCase):
    def setUp(self) -> None:
        self.parser = MarkdownParser()

    def test_parse_tts_block_and_body(self) -> None:
        content = """```tts
engine: melo
format: wav
voice.default: KR
speed.default: 1.0
style.default: conversational
normalize_spoken_text: true
sentence_split: true
pause_ms.line: 300
pause_ms.paragraph: 700
voice.진행자: KR_FEMALE
speed.진행자: 1.1
```

진행자: 안녕하세요. 반갑습니다.
상담원: 회원가입부터 진행해 주세요.
"""
        parsed = self.parser.parse(content)
        self.assertEqual(parsed.options["engine"], "melo")
        self.assertEqual(parsed.options["output_format"], "wav")
        self.assertEqual(parsed.speaker_overrides["진행자"]["voice"], "KR_FEMALE")
        self.assertEqual(len(parsed.lines), 2)
        self.assertEqual(parsed.lines[0].speaker, "진행자")

    def test_raise_validation_error_for_unknown_key(self) -> None:
        content = """```tts
unknown.key: value
```

기본: 테스트
"""
        with self.assertRaises(Exception):
            self.parser.parse(content)

    def test_speaker_only_line_applies_to_following_lines(self) -> None:
        content = """```tts
engine: melo
```

학습자: 질문이 있어요.
진행자:
1. 첫 번째 답변
2. 두 번째 답변
"""
        parsed = self.parser.parse(content)
        self.assertEqual(len(parsed.lines), 3)
        self.assertEqual(parsed.lines[1].speaker, "진행자")
        self.assertEqual(parsed.lines[2].speaker, "진행자")

    def test_list_item_with_colon_is_not_treated_as_speaker(self) -> None:
        content = """```tts
engine: melo
```

진행자:
- 한 줄 정의: 핵심을 요약합니다.
"""
        parsed = self.parser.parse(content)
        self.assertEqual(len(parsed.lines), 1)
        self.assertEqual(parsed.lines[0].speaker, "진행자")
        self.assertEqual(parsed.lines[0].text, "- 한 줄 정의: 핵심을 요약합니다.")

    def test_markdown_emphasis_around_speaker_keeps_voice_lookup_key(self) -> None:
        content = """```tts
engine: melo
voice.진행자: sample:중후한_남성
```

**진행자:** 안녕하세요.
"""
        parsed = self.parser.parse(content)
        self.assertEqual(parsed.speaker_overrides["진행자"]["voice"], "sample:중후한_남성")
        self.assertEqual(len(parsed.lines), 1)
        self.assertEqual(parsed.lines[0].speaker, "진행자")
        self.assertEqual(parsed.lines[0].text, "안녕하세요.")

    def test_markdown_emphasis_speaker_only_line_applies_to_following_lines(self) -> None:
        content = """```tts
engine: melo
voice.진행자: sample:중후한_남성
```

**진행자:**
첫 번째 답변입니다.
"""
        parsed = self.parser.parse(content)
        self.assertEqual(len(parsed.lines), 1)
        self.assertEqual(parsed.lines[0].speaker, "진행자")
        self.assertEqual(parsed.lines[0].text, "첫 번째 답변입니다.")


if __name__ == "__main__":
    unittest.main()
