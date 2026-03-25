import { ChangeEvent } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MARKDOWN_EXAMPLE = [
  "```tts",
  "engine: melo",
  "format: wav",
  "voice.default: KR",
  "voice.진행자: KR",
  "speed.상담원: 1.1",
  "```",
  "",
  "진행자: 안녕하세요.",
  "상담원: 회원가입부터 진행해 주세요.",
].join("\n");

type MarkdownUploadPanelProps = {
  file: File | null;
  onChange: (file: File | null) => void;
};

export function MarkdownUploadPanel({
  file,
  onChange,
}: MarkdownUploadPanelProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
  };

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Markdown 업로드 영역</h2>
        <p className="mt-1 text-sm text-[#525252]">
          상단의 <code>```tts</code> 블록을 우선 해석하고, 본문은 기본적으로{" "}
          <code>화자: 내용</code> 형식으로 파싱합니다.
        </p>
      </div>
      <Label htmlFor="tts-markdown-file">Markdown 파일</Label>
      <Input id="tts-markdown-file" type="file" accept=".md" onChange={handleChange} />
      <div className="mt-4 rounded-lg border border-line bg-[#fafafa] p-4 text-sm text-[#525252]">
        <div className="font-semibold text-ink">권장 문법 예시</div>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6">
          {MARKDOWN_EXAMPLE}
        </pre>
      </div>
      {file ? (
        <p className="mt-4 text-sm text-ink">
          선택된 파일: <span className="font-semibold">{file.name}</span>
        </p>
      ) : null}
    </Card>
  );
}
