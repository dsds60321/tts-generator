import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextInputPanelProps = {
  text: string;
  onChange: (value: string) => void;
};

export function TextInputPanel({ text, onChange }: TextInputPanelProps) {
  const characterCount = text.length;

  return (
    <Card className="app-reveal app-reveal-delay-2 p-0">
      <div className="border-b border-line px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle">
              DIRECT INPUT
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink">텍스트 입력</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              단일 화자 작업을 빠르게 시작하는 입력 면입니다. 생성 요청에 필요한 텍스트만
              집중해서 다룰 수 있도록 시각적 잡음을 줄였습니다.
            </p>
          </div>
          <div className="min-w-[132px] rounded-[14px] border border-line bg-panelMuted px-4 py-3 text-right">
            <div className="text-[11px] font-semibold tracking-[0.12em] text-subtle">
              CHARACTERS
            </div>
            <div className="mt-1 text-xl font-semibold text-ink">
              {characterCount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <Label htmlFor="tts-text">읽을 텍스트</Label>
        <Textarea
          id="tts-text"
          className="min-h-[280px] leading-7"
          placeholder="예: 안녕하세요. 오늘 서비스 이용 방법을 쉽게 안내해드릴게요."
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />

        <div className="mt-4 overflow-hidden rounded-[16px] border border-line">
          <div className="grid gap-px bg-line md:grid-cols-2">
            <div className="bg-panelMuted px-4 py-3 text-sm leading-6 text-muted">
              단일 화자 기본 흐름에 맞춰 텍스트를 바로 제출합니다.
            </div>
            <div className="bg-panelMuted px-4 py-3 text-sm leading-6 text-muted">
              입력 구조는 그대로 유지해 이후 speaker 단위 확장도 막지 않습니다.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
