import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JobResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  parsing: "문서 확인",
  generating: "음성 생성",
  merging: "오디오 정리",
  converting: "파일 변환",
  completed: "작업 완료",
  failed: "작업 실패",
};

export function JobStatusPanel({ job, errorMessage }: JobStatusPanelProps) {
  const isActive = job?.status === "queued" || job?.status === "processing";
  const progressTone =
    job?.status === "completed"
      ? "bg-success"
      : job?.status === "failed"
        ? "bg-danger"
        : "bg-accent";

  return (
    <Card className="app-reveal app-reveal-delay-2 p-0">
      <div className="border-b border-line px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">현재 상태</h2>
            <p className="mt-1 text-sm text-muted">
              진행 상태와 필요한 안내만 표시합니다.
            </p>
          </div>
          {job ? (
            <Badge tone={toneForStatus(job.status)}>{STATUS_LABELS[job.status]}</Badge>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-5">
        {job ? (
          <div className="space-y-4">
            <div className="rounded-[18px] border border-line bg-white p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-subtle">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isActive
                          ? "bg-warning app-status-beacon"
                          : job.status === "completed"
                            ? "bg-success"
                            : job.status === "failed"
                              ? "bg-danger"
                              : "bg-lineStrong",
                      )}
                    />
                    진행률
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink">
                    {job.progress_percent}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-subtle">현재 단계</div>
                  <div className="mt-2 text-sm font-semibold text-ink">
                    {STAGE_LABELS[job.stage]}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "mt-5 h-2 overflow-hidden rounded-full bg-white",
                  isActive && "app-progress-active",
                )}
              >
                <div
                  className={cn(
                    "app-progress-fill h-full rounded-full transition-all duration-500",
                    progressTone,
                  )}
                  style={{ width: `${job.progress_percent}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-muted">
                {isActive
                  ? "작업 중에는 상태를 자동으로 확인합니다."
                  : "필요하면 상태 새로고침으로 다시 확인할 수 있습니다."}
              </p>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-line text-sm text-muted">
              <div className="grid gap-px bg-panelMuted">
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <span className="font-medium text-subtle">작업 ID</span>
                  <code className="font-mono text-xs text-ink">{job.job_id}</code>
                </div>
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <span className="font-medium text-subtle">상태</span>
                  <span className="font-semibold text-ink">{STATUS_LABELS[job.status]}</span>
                </div>
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <span className="font-medium text-subtle">세부 단계</span>
                  <span className="font-semibold text-ink">{STAGE_LABELS[job.stage]}</span>
                </div>
              </div>
            </div>

            {job.error ? (
              <div className="rounded-[16px] border border-[rgba(180,35,24,0.18)] bg-dangerSoft p-4 text-sm leading-6 text-danger">
                문제가 있어 작업을 끝내지 못했습니다. 내용을 확인한 뒤 다시 생성해 주세요.
                <div className="mt-2">{job.error.message}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-line bg-white p-5 text-sm leading-6 text-muted">
            아직 진행 중인 작업이 없습니다. 생성 버튼을 누르면 상태가 여기에 표시됩니다.
          </div>
        )}

        {errorMessage ? (
          <div className="mt-4 rounded-[16px] border border-[rgba(180,35,24,0.18)] bg-dangerSoft p-4 text-sm leading-6 text-danger">
            서버 상태를 확인한 뒤 다시 시도해 주세요.
            <div className="mt-2">{errorMessage}</div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
