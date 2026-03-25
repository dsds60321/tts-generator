import { Card } from "@/components/ui/card";
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
  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">출력 포맷 선택 영역</h2>
      <p className="mt-1 text-sm text-[#525252]">
        기본 산출물은 WAV 기준으로 처리하며, MP3는 선택 시 후처리 변환으로 생성합니다.
      </p>

      <div className="mt-5">
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

      <div className="mt-4 rounded-lg border border-line bg-[#fafafa] p-4 text-sm text-ink">
        MP3는 WAV 생성 후 추가 변환 작업이 진행되어 WAV보다 더 오래 걸릴 수 있습니다.
      </div>

      {helperText ? (
        <p className="mt-3 text-sm leading-6 text-[#525252]">{helperText}</p>
      ) : null}
    </Card>
  );
}
