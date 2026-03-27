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
  const processing = job?.status === "queued" || job?.status === "processing";

  return (
    <Card className="app-reveal app-reveal-delay-3 p-0">
      <div className="border-b border-line px-5 py-5">
        <h2 className="text-lg font-semibold text-ink">결과 파일</h2>
        <p className="mt-1 text-sm text-muted">
          생성이 끝나면 여기에서 바로 내려받을 수 있어요.
        </p>
      </div>

      <div className="px-5 py-5">
        {completed ? (
          <div className="rounded-[18px] border border-line bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-[14px] bg-white p-3 text-ink">
                <FileAudio className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-subtle">다운로드 준비 완료</div>
                <div className="mt-1 font-semibold text-ink">{job.output?.file_name}</div>
                <div className="mt-1 text-sm text-muted">
                  포맷: {job.output?.format.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-panelMuted px-4 py-4 text-sm text-muted">
              <span>다운로드가 끝나면 서버에 남은 파일은 바로 정리됩니다.</span>
              <a href={downloadUrl} className="inline-flex">
                <Button className="min-w-[144px]">
                  <Download className="h-4 w-4" />
                  다운로드
                </Button>
              </a>
            </div>
          </div>
        ) : processing ? (
          <div className="rounded-[18px] border border-line bg-white p-5 text-sm text-muted">
            <div className="flex items-center gap-4">
              <div className="rounded-[14px] bg-white px-3 py-3">
                <div className="app-audio-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-subtle">파일 준비 중</div>
                <div className="mt-1 font-semibold text-ink">결과 파일을 만들고 있어요.</div>
                <p className="mt-1 leading-6 text-muted">
                  완료되면 파일 정보와 다운로드 버튼이 표시됩니다.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-[16px] bg-panelMuted px-4 py-3 leading-6 text-muted">
              상태가 바뀌지 않으면 새로고침 버튼으로 다시 확인해 주세요.
            </div>
          </div>
        ) : job?.status === "failed" ? (
          <div className="rounded-[16px] border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
            작업을 끝내지 못해 결과 파일이 없습니다. 상태 내용을 확인한 뒤 다시 생성해 주세요.
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
            생성이 끝나면 파일 이름과 다운로드 버튼이 여기에 표시됩니다.
          </div>
        )}
      </div>
    </Card>
  );
}
