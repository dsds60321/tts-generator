export type AudioFormat = "wav" | "mp3";
export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type JobStage =
  | "queued"
  | "parsing"
  | "generating"
  | "merging"
  | "converting"
  | "completed"
  | "failed";

export type VoiceOption = {
  key: string;
  label: string;
  language: string;
  description: string;
};

export type JobResponse = {
  job_id: string;
  status: JobStatus;
  stage: JobStage;
  source_type: string;
  requested_format: AudioFormat;
  created_at: string;
  updated_at: string;
  segments_total: number;
  segments_completed: number;
  progress_percent: number;
  output: {
    format: AudioFormat;
    file_path: string;
    file_name: string;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

export type CreateTextJobPayload = {
  text: string;
  output_format: AudioFormat;
  speaker: string;
  voice: string;
  speed: number;
  style?: "conversational";
  mode?: "conversational";
  normalize_spoken_text: boolean;
  sentence_split: boolean;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error("서버에 연결하지 못했습니다. 서버 실행 상태를 확인한 뒤 다시 시도해 주세요.");
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(payload?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }
  return (await response.json()) as T;
}

export async function listVoices(): Promise<VoiceOption[]> {
  const response = await safeFetch(`${API_BASE_URL}/voices`, {
    cache: "no-store",
  });
  return parseResponse<VoiceOption[]>(response);
}

export async function createTextJob(
  payload: CreateTextJobPayload,
): Promise<JobResponse> {
  const response = await safeFetch(`${API_BASE_URL}/jobs/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<JobResponse>(response);
}

export async function createMarkdownJob(file: File): Promise<JobResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await safeFetch(`${API_BASE_URL}/jobs/markdown`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<JobResponse>(response);
}

export async function fetchJob(jobId: string): Promise<JobResponse> {
  const response = await safeFetch(`${API_BASE_URL}/jobs/${jobId}`, {
    cache: "no-store",
  });
  return parseResponse<JobResponse>(response);
}

export function buildDownloadUrl(jobId: string): string {
  return `${API_BASE_URL}/jobs/${jobId}/download`;
}
