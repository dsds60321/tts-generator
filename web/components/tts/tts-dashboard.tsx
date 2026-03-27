"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildDownloadUrl,
  createMarkdownJob,
  createTextJob,
  fetchJob,
  listVoices,
  type JobResponse,
  type VoiceOption,
} from "@/lib/api";
import { JobStatusPanel } from "@/components/tts/job-status-panel";
import { MarkdownUploadPanel } from "@/components/tts/markdown-upload-panel";
import { ModeSwitch } from "@/components/tts/mode-switch";
import { OutputFormatPanel } from "@/components/tts/output-format-panel";
import { ResultPanel } from "@/components/tts/result-panel";
import { SpeakerSettingsPanel } from "@/components/tts/speaker-settings-panel";
import { TextInputPanel } from "@/components/tts/text-input-panel";
import { cn } from "@/lib/utils";

type InputMode = "text" | "markdown";
type OutputFormat = "wav" | "mp3";

export function TTSDashboard() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [speaker, setSpeaker] = useState("진행자");
  const [voice, setVoice] = useState("KR");
  const [speed, setSpeed] = useState(1.0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("wav");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoicesLoading, setIsVoicesLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      setIsVoicesLoading(true);
      try {
        const items = await listVoices();
        if (!active) {
          return;
        }
        setVoices(items);
        if (items[0] && !items.some((item) => item.key === voice)) {
          setVoice(items[0].key);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "보이스 목록을 불러오지 못했습니다.");
      } finally {
        if (active) {
          setIsVoicesLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") {
      return;
    }

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const latest = await fetchJob(job.job_id);
          setJob(latest);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "작업 상태를 불러오지 못했습니다.");
        }
      })();
    }, 1500);

    return () => window.clearInterval(interval);
  }, [job?.job_id, job?.status]);

  const voiceOptions = useMemo(
    () =>
      voices.map((item) => ({
        value: item.key,
        label: item.label,
      })),
    [voices],
  );
  const selectedVoice = useMemo(
    () => voices.find((item) => item.key === voice) ?? null,
    [voice, voices],
  );

  const downloadUrl =
    job?.status === "completed" ? buildDownloadUrl(job.job_id) : null;
  const statusLabel =
    job?.status === "queued"
      ? "대기 중"
      : job?.status === "processing"
        ? "처리 중"
        : job?.status === "completed"
          ? "완료"
          : job?.status === "failed"
            ? "실패"
            : "대기";
  const isJobActive = job?.status === "queued" || job?.status === "processing";
  const statusToneClass =
    isSubmitting || isJobActive
      ? "bg-warningSoft text-warning"
      : job?.status === "completed"
        ? "bg-successSoft text-success"
        : job?.status === "failed"
          ? "bg-dangerSoft text-danger"
          : "bg-panelMuted text-subtle";
  const primaryActionLabel = isSubmitting ? "생성 중..." : "음성 생성하기";
  const isPrimaryActionDisabled =
    isSubmitting || (inputMode === "text" ? !text.trim() : !markdownFile);
  const actionSummary = [
    inputMode === "text" ? "직접 입력" : "Markdown 업로드",
    inputMode === "markdown" ? "문서 설정 우선" : outputFormat.toUpperCase(),
    `${Math.round(speed * 100)}% 속도`,
  ].join(" · ");

  async function handleSubmit() {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (inputMode === "text") {
        if (!text.trim()) {
          throw new Error("텍스트 입력 모드에서는 읽을 텍스트를 입력해야 합니다.");
        }
        const created = await createTextJob({
          text,
          output_format: outputFormat,
          speaker,
          voice,
          speed,
          style: "conversational",
          mode: "conversational",
          normalize_spoken_text: true,
          sentence_split: true,
        });
        setJob(created);
        return;
      }

      if (!markdownFile) {
        throw new Error("Markdown 업로드 모드에서는 `.md` 파일을 선택해야 합니다.");
      }
      const created = await createMarkdownJob(markdownFile);
      setJob(created);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "작업 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefresh() {
    if (!job) {
      return;
    }
    try {
      const latest = await fetchJob(job.job_id);
      setJob(latest);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "작업 상태를 새로고침하지 못했습니다.");
    }
  }

  return (
    <main className="min-h-screen bg-panelMuted px-4 pb-36 pt-5 sm:px-6 sm:pb-40 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_308px]">
          <div className="space-y-6">
            <Card className="p-6 sm:p-7">
              <div className="mb-6 border-b border-line pb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
                      statusToneClass,
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full bg-current",
                        (isSubmitting || isJobActive) && "app-status-beacon",
                      )}
                    />
                    {job ? statusLabel : "대기 중"}
                  </span>
                </div>
                <h1 className="mt-4 text-[1.9rem] font-semibold tracking-[-0.04em] text-ink sm:text-[2.2rem]">
                  음성 만들기
                </h1>
              </div>
              <ModeSwitch value={inputMode} onChange={setInputMode} />
              <div className="mt-7">
                {inputMode === "text" ? (
                  <TextInputPanel text={text} onChange={setText} />
                ) : (
                  <MarkdownUploadPanel file={markdownFile} onChange={setMarkdownFile} />
                )}
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-ink">옵션 설정</h2>
                <p className="mt-1 text-sm text-muted">
                  필요한 항목만 확인하면 됩니다. 문서 업로드 시 문서 설정이 우선 적용됩니다.
                </p>
              </div>
              <div className="space-y-8">
                <SpeakerSettingsPanel
                  speaker={speaker}
                  voice={voice}
                  speed={speed}
                  disabled={inputMode === "markdown"}
                  isLoadingVoices={isVoicesLoading}
                  voices={voiceOptions}
                  voiceDescription={selectedVoice?.description ?? null}
                  onSpeakerChange={setSpeaker}
                  onVoiceChange={setVoice}
                  onSpeedChange={setSpeed}
                />

                <div className="border-t border-line pt-8">
                  <OutputFormatPanel
                    value={outputFormat}
                    disabled={inputMode === "markdown"}
                    helperText={
                      inputMode === "markdown"
                        ? "문서에 파일 형식이 적혀 있으면 그 값을 사용하고, 없으면 기본값을 사용합니다."
                        : "직접 입력 모드에서는 여기서 고른 형식으로 결과 파일을 만듭니다."
                    }
                    onChange={setOutputFormat}
                  />
                </div>
              </div>
            </Card>

            <div className="px-1 text-sm text-subtle">
              {job
                ? `현재 상태: ${statusLabel}`
                : inputMode === "text"
                  ? "텍스트를 입력하면 바로 생성할 수 있습니다."
                  : "Markdown 파일을 선택하면 바로 생성할 수 있습니다."}
            </div>
          </div>

          <div className="space-y-5 self-start xl:sticky xl:top-6">
            <JobStatusPanel job={job} errorMessage={errorMessage} />
            <ResultPanel job={job} downloadUrl={downloadUrl} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="pointer-events-auto rounded-[20px] border border-[rgba(15,23,40,0.08)] bg-white/96 p-4 shadow-[0_-8px_30px_rgba(15,23,40,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-subtle">바로 실행</div>
                <div className="mt-1 text-sm font-medium text-ink">{actionSummary}</div>
                <div className="mt-1 text-sm text-muted">
                  {job ? `현재 상태 ${statusLabel}` : "설정을 확인한 뒤 바로 생성해 주세요."}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleSubmit}
                  disabled={isPrimaryActionDisabled}
                  className="min-w-[180px]"
                >
                  {isSubmitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {primaryActionLabel}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRefresh}
                  disabled={!job}
                  className="min-w-[152px]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  상태 새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
