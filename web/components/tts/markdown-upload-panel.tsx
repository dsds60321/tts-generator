import { ChangeEvent } from "react";

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
    <div className="app-reveal app-reveal-delay-2">
      <div>
        <h2 className="text-lg font-semibold text-ink">Markdown 업로드</h2>
        <p className="mt-1 text-sm text-muted">
          문서 형식이 정리된 파일이 있으면 그대로 올려서 만들 수 있어요.
        </p>
      </div>

      <div className="mt-5">
        <Label htmlFor="tts-markdown-file" className="text-xs tracking-[0.08em]">
          Markdown 파일
        </Label>
        <Input
          id="tts-markdown-file"
          className="cursor-pointer rounded-[18px] border-white bg-white shadow-[0_10px_30px_rgba(15,23,40,0.06)]"
          type="file"
          accept=".md"
          onChange={handleChange}
        />

        {file ? (
          <div className="mt-4 rounded-[16px] border border-line bg-white px-4 py-4 text-sm text-ink">
            선택한 파일: <span className="font-semibold">{file.name}</span>
          </div>
        ) : (
          <div className="mt-4 rounded-[16px] border border-dashed border-lineStrong bg-panelMuted px-4 py-4 text-sm text-muted">
            아직 선택한 파일이 없어요. `.md` 파일을 올리면 문서 설정을 함께 읽습니다.
          </div>
        )}

        <details className="mt-4 rounded-[16px] bg-panelMuted px-4 py-4 text-sm text-muted">
          <summary className="cursor-pointer list-none font-semibold text-ink">
            예시 보기
          </summary>
          <p className="mt-3 leading-6">
            파일 안에 설정이 있으면 그 값을 우선 사용합니다. 본문은 보통{" "}
            <code className="rounded bg-white px-1.5 py-0.5">화자: 내용</code> 형식으로
            작성합니다.
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-[14px] bg-white px-4 py-4 font-mono text-xs leading-6 text-ink">
            {MARKDOWN_EXAMPLE}
          </pre>
        </details>
      </div>
    </div>
  );
}
