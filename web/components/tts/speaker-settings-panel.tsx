import { Card } from "@/components/ui/card";
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
    <Card className="app-reveal app-reveal-delay-3 p-0">
      <div className="border-b border-line px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle">
              VOICE PROFILE
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink">화자 설정</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              단일 화자 기준 설정 면입니다. 백엔드로 전달되는 구조는 유지하면서 현재 사용
              가능한 보이스와 속도를 더 선명하게 읽도록 정리했습니다.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em]",
              disabled
                ? "border-line bg-panelMuted text-subtle"
                : isLoadingVoices
                  ? "border-[rgba(181,71,8,0.16)] bg-warningSoft text-warning"
                  : "border-[rgba(6,118,71,0.14)] bg-successSoft text-success",
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
              ? "문서 설정 적용 중"
              : isLoadingVoices
                ? "보이스 목록 로딩 중"
                : "실시간 선택 가능"}
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        {disabled ? (
          <div className="app-disabled-note mb-4 rounded-[14px] border border-line bg-panelMuted px-4 py-3 text-sm leading-6 text-muted">
            Markdown 업로드 모드에서는 문서 내부의{" "}
            <code className="rounded bg-white px-1.5 py-0.5">voice</code>,{" "}
            <code className="rounded bg-white px-1.5 py-0.5">speaker</code>,{" "}
            <code className="rounded bg-white px-1.5 py-0.5">speed</code> 설정이 우선
            적용됩니다.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[16px] border border-line bg-panelMuted p-4">
            <Label htmlFor="speaker-name">화자 이름</Label>
            <Input
              id="speaker-name"
              value={speaker}
              disabled={disabled}
              onChange={(event) => onSpeakerChange(event.target.value)}
            />
            <p className="mt-2 text-xs leading-5 text-subtle">
              UI 기본값이며, 구조상 이후 speaker 단위 확장이 가능합니다.
            </p>
          </div>

          <div className="rounded-[16px] border border-line bg-panelMuted p-4">
            <Label htmlFor="speaker-voice">보이스</Label>
            <Select
              id="speaker-voice"
              value={voice}
              disabled={voiceSelectDisabled}
              options={selectOptions}
              onChange={(event) => onVoiceChange(event.target.value)}
            />
            {isLoadingVoices ? (
              <div className="mt-3 space-y-2">
                <div className="app-skeleton h-3 w-5/6" />
                <div className="app-skeleton h-3 w-3/5" />
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-subtle">
                {voiceDescription ?? "현재 엔진에서 실제로 선택 가능한 보이스만 표시합니다."}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-[16px] border border-line bg-panelMuted p-5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="speaker-speed" className="mb-0">
              속도
            </Label>
            <div className="text-sm font-semibold text-ink">
              {speedPercent}%{" "}
              <span className="ml-1 text-subtle">{describeSpeed(speed)}</span>
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
            <span>50% 느림</span>
            <span>100% 기본</span>
            <span>130% 빠름</span>
            <span>200% 최대</span>
          </div>

          {disabled ? (
            <div className="app-disabled-note mt-4 rounded-[12px] border border-[rgba(16,32,51,0.08)] bg-white px-4 py-3 text-xs leading-5 text-muted">
              현재 속도 슬라이더는 잠겨 있으며, 업로드한 문서의 화자별 속도값이 우선
              적용됩니다.
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-muted">
              100%는 기본 속도입니다. 보통 115%부터 조금 빨라진 느낌이 나고, 130%
              이상이면 빠르게 읽는 인상이 분명해집니다.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
