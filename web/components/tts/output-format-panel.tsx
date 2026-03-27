import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
      description: "생성 후 바로 내려받기 좋은 기본 형식",
    },
    {
      value: "mp3" as const,
      label: "MP3",
      description: "변환이 추가로 진행되어 더 오래 걸릴 수 있는 형식",
    },
  ];

  return (
    <div className="app-reveal app-reveal-delay-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">파일 형식</h2>
          <p className="mt-1 text-sm text-muted">
            내려받을 파일 형식을 선택해 주세요.
          </p>
        </div>
        <span className="rounded-full bg-panelMuted px-3 py-1.5 text-xs font-semibold text-subtle">
          {disabled ? "문서 설정 사용" : "직접 선택"}
        </span>
      </div>

      {disabled ? (
        <div className="mt-4 rounded-[16px] bg-panelMuted px-4 py-4 text-sm leading-6 text-muted">
          업로드한 문서에 형식 설정이 있으면 그 값을 우선 사용합니다.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div>
          <Label htmlFor="output-format" className="text-xs tracking-[0.08em]">
            출력 포맷
          </Label>
          <Select
            id="output-format"
            value={value}
            disabled={disabled}
            options={[
              { value: "wav", label: "WAV" },
              { value: "mp3", label: "MP3" },
            ]}
            className="rounded-[16px] border-white bg-white shadow-[0_10px_30px_rgba(15,23,40,0.06)]"
            onChange={(event) => onChange(event.target.value as "wav" | "mp3")}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {formats.map((format) => (
            <div
              key={format.value}
              className={
                value === format.value
                  ? "rounded-[16px] border border-lineStrong bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,40,0.06)]"
                  : "rounded-[16px] bg-panelMuted px-4 py-4"
              }
            >
              <div className="text-sm font-semibold text-ink">{format.label}</div>
              <p className="mt-1 text-sm text-muted">{format.description}</p>
            </div>
          ))}
        </div>
      </div>

      {helperText ? <p className="mt-3 text-sm text-muted">{helperText}</p> : null}
    </div>
  );
}
