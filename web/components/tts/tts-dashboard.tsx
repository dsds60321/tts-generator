"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildDownloadUrl,
  createMarkdownJob,
  createTextJob,
  fetchJob,
  listVoices,
  type JobResponse,
  type VoiceOption,
} from "@/lib/api";
import { MarkdownUploadPanel } from "@/components/tts/markdown-upload-panel";
import { JobStatusPanel } from "@/components/tts/job-status-panel";
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
  const summaryCards = [
    {
      label: "입력 채널",
      value: inputMode === "text" ? "텍스트 직접 입력" : "Markdown 업로드",
      meta:
        inputMode === "text"
          ? `${text.length.toLocaleString()}자 준비됨`
          : markdownFile?.name ?? "선택된 파일 없음",
    },
    {
      label: "화자 프로필",
      value: inputMode === "markdown" ? "문서 설정 우선" : speaker,
      meta:
        inputMode === "markdown"
          ? "`tts` 블록 기준"
          : selectedVoice?.label ?? voice,
    },
    {
      label: "출력 규격",
      value: inputMode === "markdown" ? "문서 지시값 우선" : outputFormat.toUpperCase(),
      meta: inputMode === "markdown" ? "기본값 WAV" : "단일 파일 결과물",
    },
    {
      label: "작업 상태",
      value: statusLabel,
      meta: job ? `${job.progress_percent}% 진행` : "아직 요청 없음",
    },
  ];
  const workspaceHighlights = [
    {
      label: "문서 처리",
      description:
        inputMode === "text"
          ? "텍스트를 바로 segment 단위 처리 흐름에 전달합니다."
          : "`tts` 블록과 `화자: 내용` 문법을 우선 해석합니다.",
    },
    {
      label: "출력 흐름",
      description:
        inputMode === "markdown"
          ? "문서 지시값이 있으면 포맷과 화자 설정을 그대로 사용합니다."
          : `${outputFormat.toUpperCase()} 기준 파이프라인으로 결과를 정리합니다.`,
    },
    {
      label: "보관 정책",
      description: "다운로드가 끝나면 서버 저장본을 즉시 정리합니다.",
    },
  ];

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
    <main className="min-h-screen bg-canvas px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="space-y-6">
            <section className="app-reveal overflow-hidden rounded-[22px] border border-line bg-panel">
              <div className="grid gap-8 px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-md border border-line bg-panelMuted px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-subtle">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isSubmitting || isJobActive
                            ? "bg-warning app-status-beacon"
                            : job?.status === "completed"
                              ? "bg-success"
                              : job?.status === "failed"
                                ? "bg-danger"
                                : "bg-lineStrong",
                        )}
                      />
                      {job ? `현재 상태 ${statusLabel}` : "새 작업 대기"}
                    </span>
                  </div>
                  <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-[2.6rem]">
                    웹 TTS 생성기
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
                    텍스트 입력과 Markdown 업로드를 같은 생성 파이프라인으로 연결합니다.
                    운영 화면은 단순하게 유지하고, 실제 생성 로직과 결과 다운로드 흐름은
                    그대로 보존했습니다.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-[16px] border border-line">
                    <div className="grid gap-px bg-line sm:grid-cols-3">
                      {workspaceHighlights.map((item) => (
                        <div key={item.label} className="bg-panelMuted px-4 py-4">
                          <div className="text-[11px] font-semibold tracking-[0.12em] text-subtle">
                            {item.label}
                          </div>
                          <div className="mt-2 text-sm leading-6 text-muted">
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[18px] border border-line">
                  <div className="grid gap-px bg-line sm:grid-cols-2">
                    {summaryCards.map((item) => (
                      <div key={item.label} className="bg-white px-4 py-4">
                        <div className="text-[11px] font-semibold tracking-[0.12em] text-subtle">
                          {item.label}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-ink">{item.value}</div>
                        <div className="mt-1 text-sm leading-6 text-muted">{item.meta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <ModeSwitch value={inputMode} onChange={setInputMode} />

            {inputMode === "text" ? (
              <TextInputPanel text={text} onChange={setText} />
            ) : (
              <MarkdownUploadPanel file={markdownFile} onChange={setMarkdownFile} />
            )}

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

            <OutputFormatPanel
              value={outputFormat}
              disabled={inputMode === "markdown"}
              helperText={
                inputMode === "markdown"
                  ? "Markdown 업로드 모드에서는 파일 내부 `tts` 블록의 `format` 설정이 우선 적용됩니다. 설정이 없으면 시스템 기본값 `wav` 를 사용합니다."
                  : "텍스트 직접 입력 모드에서는 여기서 선택한 포맷이 그대로 적용됩니다."
              }
              onChange={setOutputFormat}
            />

            <section className="app-reveal app-reveal-delay-4 relative overflow-hidden rounded-[18px] border border-[#111827] bg-[#111827] px-5 py-5 text-white sm:px-6">
              <div className="app-runline absolute inset-x-0 top-0 h-px" />
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-white/70">
                    EXECUTION
                  </div>
                  <div className="mt-2 text-lg font-semibold">생성 작업 제어</div>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    현재 입력값으로 생성 작업을 시작하거나, 기존 작업 상태를 수동으로 다시
                    조회합니다.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-[168px] border-white bg-white text-accent hover:bg-[#f2f5f8]"
                  >
                    {isSubmitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : null}
                    음성 생성 시작
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleRefresh}
                    disabled={!job}
                    className="min-w-[156px] border-white/15 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    상태 새로고침
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6 self-start xl:sticky xl:top-4">
            <JobStatusPanel job={job} errorMessage={errorMessage} />
            <ResultPanel job={job} downloadUrl={downloadUrl} />
          </div>
        </div>
      </div>
    </main>
  );
}
