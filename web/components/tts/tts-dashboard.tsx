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

  useEffect(() => {
    void (async () => {
      try {
        const items = await listVoices();
        setVoices(items);
        if (items[0] && !items.some((item) => item.key === voice)) {
          setVoice(items[0].key);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "보이스 목록을 불러오지 못했습니다.");
      }
    })();
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
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-xl border border-line bg-panel p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#737373]">
            TTS Workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            웹 TTS 생성기
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#525252]">
            텍스트 입력과 Markdown 업로드를 공통 TTS 문서 구조로 처리합니다. 생성은
            segment 단위로 진행하고, 결과는 WAV 기준으로 병합한 뒤 필요할 때만 MP3로 변환합니다.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
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

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                음성 생성 시작
              </Button>
              <Button variant="secondary" onClick={handleRefresh} disabled={!job}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                상태 새로고침
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <JobStatusPanel job={job} errorMessage={errorMessage} />
            <ResultPanel job={job} downloadUrl={downloadUrl} />
          </div>
        </div>
      </div>
    </main>
  );
}
