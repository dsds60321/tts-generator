import { cn } from "@/lib/utils";

type InputMode = "text" | "markdown";

type ModeSwitchProps = {
  value: InputMode;
  onChange: (value: InputMode) => void;
};

const MODES: Array<{ value: InputMode; label: string; description: string }> = [
  {
    value: "text",
    label: "텍스트 직접 입력",
    description: "단일 화자 MVP 흐름에 최적화된 입력 방식",
  },
  {
    value: "markdown",
    label: "Markdown 업로드",
    description: "`tts` 블록과 `화자: 내용` 문법을 그대로 반영",
  },
];

export function ModeSwitch({ value, onChange }: ModeSwitchProps) {
  return (
    <div className="app-reveal app-reveal-delay-1 overflow-hidden rounded-[18px] border border-line">
      <div className="grid gap-px bg-line md:grid-cols-2">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={cn(
              "relative bg-panel px-5 py-5 text-left transition-colors duration-150",
              value === mode.value ? "bg-white" : "bg-panelMuted hover:bg-panel",
            )}
          >
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-[2px] transition-opacity",
                value === mode.value ? "bg-accent opacity-100" : "bg-transparent opacity-0",
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mt-4 text-base font-semibold text-ink">{mode.label}</div>
                <div className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  {mode.description}
                </div>
              </div>
              {value === mode.value ? (
                <span className="rounded-md border border-[rgba(29,41,57,0.12)] bg-accentSoft px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-accent">
                  Active
                </span>
              ) : (
                <span className="rounded-md border border-line bg-white px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-subtle">
                  Ready
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
