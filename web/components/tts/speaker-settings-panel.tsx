import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type VoiceOption = {
  value: string;
  label: string;
};

type SpeakerSettingsPanelProps = {
  speaker: string;
  voice: string;
  speed: number;
  disabled?: boolean;
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
  voices,
  voiceDescription,
  onSpeakerChange,
  onVoiceChange,
  onSpeedChange,
}: SpeakerSettingsPanelProps) {
  const speedPercent = Math.round(speed * 100);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">화자 설정 영역</h2>
      <p className="mt-1 text-sm text-[#525252]">
        단일 화자 입력 기준 설정입니다. 구조는 speaker 단위로 나뉘어 있어 이후 멀티 화자 입력 UI로 확장할 수 있습니다.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="speaker-name">화자 이름</Label>
          <Input
            id="speaker-name"
            value={speaker}
            disabled={disabled}
            onChange={(event) => onSpeakerChange(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="speaker-voice">보이스</Label>
          <Select
            id="speaker-voice"
            value={voice}
            disabled={disabled}
            options={voices}
            onChange={(event) => onVoiceChange(event.target.value)}
          />
          <p className="mt-2 text-xs leading-5 text-[#737373]">
            {voiceDescription ?? "현재 엔진에서 실제로 선택 가능한 보이스만 표시합니다."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-[#fafafa] p-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="speaker-speed" className="mb-0">
            속도
          </Label>
          <div className="text-sm font-semibold text-ink">
            {speedPercent}% <span className="ml-1 text-[#737373]">{describeSpeed(speed)}</span>
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
          className="mt-4 h-2 w-full cursor-pointer accent-black disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="mt-3 flex items-center justify-between text-[11px] text-[#737373]">
          <span>50% 느림</span>
          <span>100% 기본</span>
          <span>130% 빠름</span>
          <span>200% 최대</span>
        </div>

        <p className="mt-3 text-xs leading-5 text-[#525252]">
          100%는 기본 속도입니다. 보통 115%부터 조금 빨라진 느낌이 나고, 130% 이상이면 빠르게 읽는 인상이 분명해집니다.
        </p>
      </div>
    </Card>
  );
}
