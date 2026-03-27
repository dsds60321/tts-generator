import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type VoiceOption = {
  value: string;
  label: string;
};

type SpeakerSettingsPanelProps = {
  speaker: string;
  voice: string;
  speed: number;
  disabled?: boolean;
  isLoadingVoices?: boolean;
  voices: VoiceOption[];
  voiceDescription?: string | null;
  onSpeakerChange: (value: string) => void;
  onVoiceChange: (value: string) => void;
  onSpeedChange: (value: number) => void;
};

function describeSpeed(speed: number) {
  const percent = Math.round(speed * 100);
  if (percent <= 70) return "매우 느림";
  if (percent <= 90) return "느림";
  if (percent <= 110) return "기본";
  if (percent <= 130) return "약간 빠름";
  if (percent <= 160) return "빠름";
  return "매우 빠름";
}

export function SpeakerSettingsPanel({
  speaker,
  voice,
  speed,
  disabled,
  isLoadingVoices,
  voices,
  voiceDescription,
  onSpeakerChange,
  onVoiceChange,
  onSpeedChange,
}: SpeakerSettingsPanelProps) {
  const speedPercent = Math.round(speed * 100);
  const voiceSelectDisabled = disabled || isLoadingVoices || voices.length === 0;
  const selectOptions =
    voices.length > 0
      ? voices
      : [
          {
            value: voice,
            label: isLoadingVoices ? "보이스 목록 로딩 중" : "선택 가능한 보이스 없음",
          },
        ];

  return (
    <div className="app-reveal app-reveal-delay-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">화자와 속도</h2>
          <p className="mt-1 text-sm text-muted">
            필요한 설정만 확인하고 바로 시작할 수 있게 정리했습니다.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
            disabled
              ? "bg-panelMuted text-subtle"
              : isLoadingVoices
                ? "bg-warningSoft text-warning"
                : "bg-successSoft text-success",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              disabled
                ? "bg-lineStrong"
                : isLoadingVoices
                  ? "bg-warning app-status-beacon"
                  : "bg-success",
            )}
          />
          {disabled
            ? "문서 설정 사용"
            : isLoadingVoices
              ? "보이스 불러오는 중"
              : "설정 가능"}
        </span>
      </div>

      {disabled ? (
        <div className="mt-4 rounded-[16px] bg-panelMuted px-4 py-4 text-sm leading-6 text-muted">
          업로드한 문서에 적힌 화자, 보이스, 속도 설정을 우선 사용합니다.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="speaker-name" className="text-xs tracking-[0.08em]">
            화자명
          </Label>
          <Input
            id="speaker-name"
            value={speaker}
            disabled={disabled}
            className="rounded-[16px] border-white bg-white shadow-[0_10px_30px_rgba(15,23,40,0.06)]"
            onChange={(event) => onSpeakerChange(event.target.value)}
          />
          <p className="mt-2 text-sm text-muted">직접 입력 모드에서 사용할 이름입니다.</p>
        </div>

        <div>
          <Label htmlFor="speaker-voice" className="text-xs tracking-[0.08em]">
            보이스
          </Label>
          <Select
            id="speaker-voice"
            value={voice}
            disabled={voiceSelectDisabled}
            options={selectOptions}
            className="rounded-[16px] border-white bg-white shadow-[0_10px_30px_rgba(15,23,40,0.06)]"
            onChange={(event) => onVoiceChange(event.target.value)}
          />
          {isLoadingVoices ? (
            <p className="mt-2 text-sm text-muted">선택 가능한 보이스를 불러오고 있어요.</p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {voiceDescription ?? "지금 사용할 수 있는 보이스만 보여줍니다."}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-[18px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,40,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="speaker-speed" className="mb-0 text-xs tracking-[0.08em]">
            속도
          </Label>
          <div className="text-sm font-semibold text-ink">
            {speedPercent}% <span className="ml-1 text-muted">{describeSpeed(speed)}</span>
          </div>
        </div>

        <input
          id="speaker-speed"
          type="range"
          min={50}
          max={200}
          step={5}
          disabled={disabled}
          value={speedPercent}
          onChange={(event) => onSpeedChange(Number(event.target.value) / 100)}
          className="app-range mt-4 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-3 flex items-center justify-between text-[11px] text-subtle">
          <span>느리게</span>
          <span>기본</span>
          <span>빠르게</span>
        </div>

        <p className="mt-3 text-sm text-muted">
          {disabled
            ? "문서에 적힌 속도 설정을 그대로 사용합니다."
            : "100%가 기본 속도입니다. 필요할 때만 조절해 주세요."}
        </p>
      </div>
    </div>
  );
}
