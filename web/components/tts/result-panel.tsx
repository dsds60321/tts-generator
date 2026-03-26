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
      <div className="border-b border-line px-6 py-5">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle">
          DELIVERY
        </p>
        <h2 className="mt-2 text-lg font-semibold text-ink">결과 다운로드</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          생성이 끝나면 선택한 포맷의 파일만 다운로드할 수 있습니다. 다운로드가 끝나면
          서버 저장본은 바로 삭제됩니다.
        </p>
      </div>

      <div className="px-6 py-6">
        {completed ? (
          <div className="rounded-[16px] border border-line bg-panelMuted p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-[14px] border border-line bg-white p-3 text-ink">
                <FileAudio className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.12em] text-subtle">
                  READY FOR DOWNLOAD
                </div>
                <div className="mt-1 font-semibold text-ink">{job.output?.file_name}</div>
                <div className="mt-1 text-sm text-muted">
                  포맷: {job.output?.format.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-white px-4 py-3 text-sm text-muted">
              <span>다운로드 이후 서버 저장본은 즉시 삭제됩니다.</span>
              <a href={downloadUrl} className="inline-flex">
                <Button className="min-w-[144px]">
                  <Download className="h-4 w-4" />
                  다운로드
                </Button>
              </a>
            </div>
          </div>
        ) : processing ? (
          <div className="rounded-[16px] border border-line bg-panelMuted p-5 text-sm text-muted">
            <div className="flex items-center gap-4">
              <div className="rounded-[14px] border border-line bg-white px-3 py-3">
                <div className="app-audio-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.12em] text-subtle">
                  PREPARING FILE
                </div>
                <div className="mt-1 font-semibold text-ink">
                  결과 파일을 정리하고 있습니다.
                </div>
                <p className="mt-1 leading-6 text-muted">
                  생성이 끝나면 다운로드 가능한 파일 이름과 포맷이 여기에 표시됩니다.
                </p>
              </div>
            </div>
            <div className="app-disabled-note mt-4 rounded-[14px] border border-line bg-white px-4 py-3 leading-6 text-muted">
              현재 작업 단계에 따라 병합 또는 변환이 진행 중일 수 있습니다.
            </div>
          </div>
        ) : job?.status === "failed" ? (
          <div className="rounded-[16px] border border-dashed border-lineStrong bg-panelMuted p-5 text-sm leading-6 text-muted">
            작업이 실패해 다운로드 가능한 결과가 없습니다. 상태 패널의 에러 메시지를 확인한 뒤
            다시 생성해 주세요.
          </div>
        ) : (
          <div className="app-empty-state rounded-[16px] border border-dashed border-lineStrong bg-panelMuted p-5 text-sm leading-6 text-muted">
            완료된 작업이 생기면 다운로드 버튼과 파일 정보가 여기에 표시됩니다.
          </div>
        )}
      </div>
    </Card>
  );
}
