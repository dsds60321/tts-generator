import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextInputPanelProps = {
  text: string;
  onChange: (value: string) => void;
};

export function TextInputPanel({ text, onChange }: TextInputPanelProps) {
  const characterCount = text.length;

  return (
    <div className="app-reveal app-reveal-delay-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">텍스트 입력</h2>
          <p className="mt-1 text-sm text-muted">
            읽을 문장을 붙여 넣으면 바로 음성을 만들 수 있어요.
          </p>
        </div>
        <div className="rounded-full bg-panelMuted px-4 py-2 text-sm font-semibold text-ink">
          {characterCount.toLocaleString()}자
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="tts-text" className="text-xs tracking-[0.08em]">
          읽을 내용
        </Label>
        <Textarea
          id="tts-text"
          className="min-h-[320px] rounded-[18px] border-white bg-white leading-7 shadow-[0_10px_30px_rgba(15,23,40,0.06)]"
          placeholder="예: 안녕하세요. 서비스 이용 방법을 차례대로 안내해 드릴게요."
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
        <p className="mt-3 text-sm text-muted">
          한 명의 목소리로 읽을 문장을 입력해 주세요.
        </p>
      </div>
    </div>
  );
}
