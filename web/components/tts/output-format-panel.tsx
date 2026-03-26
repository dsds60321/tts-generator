import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OutputFormatPanelProps = {
  value: "wav" | "mp3";
  disabled?: boolean;
  helperText?: string;
  onChange: (value: "wav" | "mp3") => void;
};

export function OutputFormatPanel({
  value,
  disabled,
  helperText,
  onChange,
}: OutputFormatPanelProps) {
  const formats = [
    {
      value: "wav" as const,
      label: "WAV",
      title: "기본 파이프라인",
      description: "생성 직후 바로 병합 결과를 사용합니다.",
    },
    {
      value: "mp3" as const,
      label: "MP3",
      title: "후처리 변환 포함",
      description: "WAV 생성 후 추가 변환이 진행되어 더 오래 걸릴 수 있습니다.",
    },
  ];

  return (
    <Card className="app-reveal app-reveal-delay-3 p-0">
      <div className="border-b border-line px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle">
              OUTPUT POLICY
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink">출력 포맷</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              기본 산출물은 WAV 기준으로 처리하며, MP3는 선택 시 후처리 변환으로
              생성합니다.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em]",
              disabled
                ? "border-line bg-panelMuted text-subtle"
                : "border-[rgba(16,32,51,0.12)] bg-accentSoft text-accent",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                disabled ? "bg-lineStrong" : "bg-accent app-status-beacon",
              )}
            />
            {disabled ? "문서 포맷 우선" : "수동 선택 가능"}
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        {disabled ? (
          <div className="app-disabled-note mb-4 rounded-[14px] border border-line bg-panelMuted px-4 py-3 text-sm leading-6 text-muted">
            Markdown 업로드 모드에서는 파일 내부의{" "}
            <code className="rounded bg-white px-1.5 py-0.5">format</code> 값이 우선
            적용됩니다. 설정이 없을 때만 시스템 기본값을 사용합니다.
          </div>
        ) : null}

        <div className="rounded-[16px] border border-line bg-panelMuted p-4">
          <Label htmlFor="output-format">출력 포맷</Label>
          <Select
            id="output-format"
            value={value}
            disabled={disabled}
            options={[
              { value: "wav", label: "WAV" },
              { value: "mp3", label: "MP3" },
            ]}
            onChange={(event) => onChange(event.target.value as "wav" | "mp3")}
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-[16px] border border-line">
          <div className="grid gap-px bg-line md:grid-cols-2">
            {formats.map((format) => (
              <div
                key={format.value}
                className={cn(
                  "px-4 py-4 text-sm text-muted",
                  value === format.value ? "bg-white" : "bg-panelMuted",
                )}
              >
                <div className="text-xs font-semibold tracking-[0.08em] text-subtle">
                  {format.label}
                </div>
                <div className="mt-2 font-semibold text-ink">{format.title}</div>
                <p className="mt-1 leading-6">{format.description}</p>
              </div>
            ))}
          </div>
        </div>

        {helperText ? (
          <p className="mt-4 text-sm leading-6 text-muted">{helperText}</p>
        ) : null}
      </div>
    </Card>
  );
}
