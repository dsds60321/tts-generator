import { cn } from "@/lib/utils";

type InputMode = "text" | "markdown";

type ModeSwitchProps = {
  value: InputMode;
  onChange: (value: InputMode) => void;
};

const MODES: Array<{ value: InputMode; label: string; description: string }> = [
  {
    value: "text",
    label: "직접 입력",
    description: "문장을 바로 입력해 만들기",
  },
  {
    value: "markdown",
    label: "Markdown 업로드",
    description: "문서 파일로 만들기",
  },
];

export function ModeSwitch({ value, onChange }: ModeSwitchProps) {
  return (
    <div className="app-reveal app-reveal-delay-1">
      <div className="mb-3">
        <div className="text-sm font-semibold text-ink">입력 방식</div>
        <p className="mt-1 text-sm text-muted">작업할 방식을 선택해 주세요.</p>
      </div>
      <div className="inline-grid w-full gap-2 rounded-[18px] bg-panelMuted p-1.5 md:w-auto md:grid-cols-2">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={cn(
              "min-w-[180px] rounded-[14px] px-4 py-3 text-left transition-all duration-150",
              value === mode.value
                ? "bg-white shadow-[0_10px_24px_rgba(15,23,40,0.08)]"
                : "text-muted hover:bg-white/70",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 rounded-full",
                  value === mode.value ? "bg-accent" : "bg-lineStrong",
                )}
              />
              <div>
                <div className="text-sm font-semibold text-ink">{mode.label}</div>
                <div className="mt-1 text-sm text-muted">{mode.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
