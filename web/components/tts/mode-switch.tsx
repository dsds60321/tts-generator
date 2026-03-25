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
    <div className="grid gap-3 md:grid-cols-2">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors",
            value === mode.value
              ? "border-black bg-[#f5f5f5]"
              : "border-line bg-white hover:border-black/40",
          )}
        >
          <div className="text-sm font-semibold text-ink">{mode.label}</div>
          <div className="mt-1 text-sm text-[#525252]">{mode.description}</div>
        </button>
      ))}
    </div>
  );
}
