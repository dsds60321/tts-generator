import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JobResponse } from "@/lib/api";

type JobStatusPanelProps = {
  job: JobResponse | null;
  errorMessage: string | null;
};

function toneForStatus(status: JobResponse["status"]) {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "processing") return "warning";
  return "default";
}

const STATUS_LABELS: Record<JobResponse["status"], string> = {
  queued: "대기 중",
  processing: "처리 중",
  completed: "완료",
  failed: "실패",
};

const STAGE_LABELS: Record<JobResponse["stage"], string> = {
  queued: "대기열 등록",
  parsing: "문서 파싱",
  generating: "음성 생성",
  merging: "오디오 병합",
  converting: "MP3 변환",
  completed: "작업 완료",
  failed: "작업 실패",
};

export function JobStatusPanel({ job, errorMessage }: JobStatusPanelProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">작업 상태 표시 영역</h2>
          <p className="mt-1 text-sm text-[#525252]">
            작업 상태와 세부 단계를 한글로 보여줍니다.
          </p>
        </div>
        {job ? <Badge tone={toneForStatus(job.status)}>{STATUS_LABELS[job.status]}</Badge> : null}
      </div>

      {job ? (
        <div className="mt-5 space-y-3 text-sm text-[#404040]">
          <div className="flex items-center justify-between rounded-lg border border-line bg-[#fafafa] px-4 py-3">
            <span>Job ID</span>
            <code className="text-xs">{job.job_id}</code>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line bg-[#fafafa] px-4 py-3">
            <span>상태</span>
            <span className="font-medium text-ink">{STATUS_LABELS[job.status]}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line bg-[#fafafa] px-4 py-3">
            <span>세부 단계</span>
            <span className="font-medium text-ink">{STAGE_LABELS[job.stage]}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line bg-[#fafafa] px-4 py-3">
            <span>진행률</span>
            <span className="font-medium text-ink">{job.progress_percent}%</span>
          </div>
          {job.error ? (
            <div className="rounded-lg border border-line bg-[#fafafa] p-4 text-ink">
              {job.error.message}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-line bg-[#fafafa] p-4 text-sm text-[#525252]">
          아직 생성된 작업이 없습니다.
        </div>
      )}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-line bg-[#fafafa] p-4 text-sm text-ink">
          {errorMessage}
        </div>
      ) : null}
    </Card>
  );
}
