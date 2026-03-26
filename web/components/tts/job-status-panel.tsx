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
  parsing: "문서 파싱",
  generating: "음성 생성",
  merging: "오디오 병합",
  converting: "MP3 변환",
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
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle">
              JOB TELEMETRY
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink">작업 상태</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              작업 상태와 세부 단계를 운영 화면에서 바로 확인할 수 있습니다.
            </p>
          </div>
          {job ? (
            <Badge tone={toneForStatus(job.status)}>{STATUS_LABELS[job.status]}</Badge>
          ) : null}
        </div>
      </div>

      <div className="px-6 py-6">
        {job ? (
          <div className="space-y-4">
            <div className="rounded-[16px] border border-line bg-panelMuted p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-subtle">
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
                    PROGRESS
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink">
                    {job.progress_percent}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-subtle">
                    CURRENT STAGE
                  </div>
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
              <p className="mt-3 text-xs leading-5 text-subtle">
                {isActive
                  ? "작업 진행 중에는 상태를 자동으로 다시 조회합니다."
                  : "완료 또는 실패 상태에서는 수동 새로고침으로 최신 상태를 다시 확인할 수 있습니다."}
              </p>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-line">
              <div className="grid gap-px bg-line text-sm text-muted">
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <span className="font-medium text-subtle">Job ID</span>
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
              <div className="rounded-[14px] border border-[rgba(180,35,24,0.18)] bg-dangerSoft p-4 text-sm leading-6 text-danger">
                {job.error.message}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-lineStrong bg-panelMuted p-5 text-sm leading-6 text-muted">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-lineStrong app-status-beacon" />
              <div className="font-semibold text-ink">작업 대기</div>
            </div>
            <p className="mt-3">
              아직 생성된 작업이 없습니다. 요청이 들어오면 진행률, 단계, 에러 정보가 여기에
              표시됩니다.
            </p>
            <div className="mt-5 space-y-3">
              <div className="app-skeleton-block h-[84px] w-full" />
              <div className="space-y-2">
                <div className="app-skeleton h-3 w-4/5" />
                <div className="app-skeleton h-3 w-3/5" />
                <div className="app-skeleton h-3 w-5/6" />
              </div>
            </div>
          </div>
        )}

        {errorMessage ? (
          <div className="mt-4 rounded-[14px] border border-[rgba(180,35,24,0.18)] bg-dangerSoft p-4 text-sm leading-6 text-danger">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
