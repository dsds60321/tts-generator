import { Download, FileAudio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobResponse } from "@/lib/api";

type ResultPanelProps = {
  job: JobResponse | null;
  downloadUrl: string | null;
};

export function ResultPanel({ job, downloadUrl }: ResultPanelProps) {
  const completed = job?.status === "completed" && downloadUrl;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">결과 다운로드 영역</h2>
      <p className="mt-1 text-sm text-[#525252]">
        생성이 끝나면 선택한 포맷의 파일만 다운로드할 수 있습니다. 다운로드가 끝나면
        서버 저장본은 바로 삭제됩니다.
      </p>

      {completed ? (
        <div className="mt-5 rounded-xl border border-line bg-[#fafafa] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-line bg-white p-3 text-ink">
              <FileAudio className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-ink">{job.output?.file_name}</div>
              <div className="text-sm text-[#525252]">
                포맷: {job.output?.format.toUpperCase()}
              </div>
            </div>
          </div>
          <a href={downloadUrl} className="mt-4 inline-flex">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              다운로드
            </Button>
          </a>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-line bg-[#fafafa] p-4 text-sm text-[#525252]">
          완료된 작업이 생기면 다운로드 버튼이 여기에 표시됩니다.
        </div>
      )}
    </Card>
  );
}
