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
    <Card className="app-reveal app-reveal-delay-2 p-0">
      <div className="border-b border-line px-6 py-5">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle">
          DOCUMENT INGEST
        </p>
        <h2 className="mt-2 text-lg font-semibold text-ink">Markdown 업로드</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          상단의 <code className="rounded bg-panelMuted px-1.5 py-0.5">```tts</code>{" "}
          블록을 우선 해석하고, 본문은 기본적으로{" "}
          <code className="rounded bg-panelMuted px-1.5 py-0.5">화자: 내용</code>{" "}
          형식으로 파싱합니다.
        </p>
      </div>

      <div className="px-6 py-6">
        <Label htmlFor="tts-markdown-file">Markdown 파일</Label>
        <Input
          id="tts-markdown-file"
          className="cursor-pointer"
          type="file"
          accept=".md"
          onChange={handleChange}
        />

        <div className="mt-4 rounded-[16px] border border-line bg-panelMuted p-5 text-sm text-muted">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-ink">권장 문법 예시</div>
            <span className="rounded-md border border-line bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-subtle">
              Parser Spec
            </span>
          </div>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-[14px] border border-line bg-white px-4 py-4 font-mono text-xs leading-6 text-ink">
            {MARKDOWN_EXAMPLE}
          </pre>
          <p className="mt-3 text-xs leading-5 text-subtle">
            파일 내부 설정이 있으면 업로드 모드에서 해당 설정을 우선 적용합니다.
          </p>
        </div>

        {file ? (
          <div className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3 text-sm text-ink">
            선택된 파일: <span className="font-semibold">{file.name}</span>
          </div>
        ) : (
          <div className="app-empty-state mt-4 rounded-[14px] border border-dashed border-lineStrong bg-white px-4 py-4 text-sm text-muted">
            아직 업로드한 파일이 없습니다. 파일을 선택하면 문서 설정과 본문 파싱 구조를
            즉시 반영합니다.
          </div>
        )}
      </div>
    </Card>
  );
}
