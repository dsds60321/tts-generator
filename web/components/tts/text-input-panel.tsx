import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextInputPanelProps = {
  text: string;
  onChange: (value: string) => void;
};

export function TextInputPanel({ text, onChange }: TextInputPanelProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">텍스트 입력 영역</h2>
          <p className="mt-1 text-sm text-[#525252]">
            단일 화자 MVP 기준이지만, 구조는 추후 멀티 화자 UI로 확장할 수 있게 설계했습니다.
          </p>
        </div>
      </div>
      <Label htmlFor="tts-text">읽을 텍스트</Label>
      <Textarea
        id="tts-text"
        placeholder="예: 안녕하세요. 오늘 서비스 이용 방법을 쉽게 안내해드릴게요."
        value={text}
        onChange={(event) => onChange(event.target.value)}
      />
    </Card>
  );
}
