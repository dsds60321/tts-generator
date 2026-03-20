# Architecture Research

**Domain:** 한국어 TTS 프로토타입 웹 서비스
**Researched:** 2026-03-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐   ┌───────────────────────────────┐   │
│  │ Single-page UI   │   │ OpenAPI / API consumers       │   │
│  │ (HTML + JS)      │   │ curl, scripts, integrations   │   │
│  └────────┬─────────┘   └──────────────┬────────────────┘   │
│           │                            │                    │
├───────────┴────────────────────────────┴────────────────────┤
│                      FastAPI App Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐ │
│  │ /        │  │ /health  │  │ /voices    │  │ /synthesize│ │
│  │ UI route │  │ endpoint │  │ endpoint   │  │ endpoint   │ │
│  └────┬─────┘  └────┬─────┘  └────┬───────┘  └────┬──────┘ │
│       │              │             │               │        │
├───────┴──────────────┴─────────────┴───────────────┴────────┤
│                    Service / Adapter Layer                  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐   ┌──────────────────────────────┐  │
│  │ Voice catalog      │   │ TTS provider adapter         │  │
│  │ filter/formatter   │   │ edge-tts now, replace later  │  │
│  └─────────┬──────────┘   └──────────────┬───────────────┘  │
│            │                              │                  │
├────────────┴──────────────────────────────┴──────────────────┤
│                     Runtime / Local Tools                    │
│  ┌────────────────────┐   ┌──────────────────────────────┐  │
│  │ Temporary files    │   │ ffmpeg transcoding           │  │
│  │ mp3 / wav cleanup  │   │ mp3 -> wav                   │  │
│  └────────────────────┘   └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| UI route | 단일 페이지 HTML과 최소 JS 제공 | `HTMLResponse` 또는 아주 작은 정적 파일 |
| `/health` | 서버 실행 가능 여부 확인 | 단순 JSON 응답 |
| `/voices` | 사용 가능한 한국어 화자 목록 제공 | `edge-tts` 음성 목록 조회 후 한국어 필터링 |
| `/synthesize` | 입력 검증, 엔진 호출, `WAV` 응답 | Pydantic 모델 + provider 호출 + `ffmpeg` 변환 |
| TTS provider adapter | 현재 엔진 세부 구현 감춤 | phase 1에서는 `main.py` 내부 클래스/함수로도 충분 |
| Temp file manager | 임시 파일 생성과 정리 | `tempfile` + 응답 완료 후 삭제 |

## Recommended Project Structure

```text
.
├── main.py              # FastAPI 앱, UI, API, 간단한 provider 로직
├── requirements.txt     # 또는 pyproject.toml
├── README.md            # 실행 방법
└── .planning/           # GSD 문서
```

### Structure Rationale

- **`main.py`:** 첫 phase의 목적이 "전체 흐름 검증"이므로 한 파일에 핵심 경로를 모아 추적 가능성을 높인다.
- **`requirements.txt` 또는 `pyproject.toml`:** 실행 재현성을 위해 최소한의 의존성 고정은 반드시 필요하다.
- **추후 분리 기준:** `main.py`가 250-350줄 이상으로 커지거나 엔진이 2개 이상 되면 `providers.py`, `static/`, `templates/` 분리를 고려한다.

## Architectural Patterns

### Pattern 1: Thin Route + Provider Boundary

**What:** 라우트는 검증과 응답만 담당하고, 실제 음성 생성은 provider 함수/클래스에 위임한다.
**When to use:** 엔진 교체 가능성을 남겨야 하지만 파일 구조를 아직 키우고 싶지 않을 때
**Trade-offs:** 코드 흐름은 약간 늘지만, 나중에 `edge-tts` 의존을 걷어내기 쉬워진다

**Example:**
```python
class TTSProvider:
    async def list_voices(self) -> list[dict]:
        ...

    async def synthesize_to_wav(self, text: str, voice: str, speed: float) -> Path:
        ...
```

### Pattern 2: Request-scoped Temporary File Flow

**What:** 요청마다 임시 MP3/WAV 파일을 만들고, 응답 후 정리한다.
**When to use:** DB나 오브젝트 스토리지 없이 즉시 다운로드형 프로토타입을 만들 때
**Trade-offs:** 동시 요청이 많아지면 디스크 I/O 부담이 생기지만, phase 1에서는 가장 이해하기 쉽다

**Example:**
```python
tmp_dir = TemporaryDirectory()
mp3_path = Path(tmp_dir.name) / "audio.mp3"
wav_path = Path(tmp_dir.name) / "audio.wav"
```

### Pattern 3: Inline UI First, Extract Later

**What:** phase 1에서는 `main.py` 안에 최소 HTML/JS를 넣고, 안정화 후 정적 파일로 분리한다.
**When to use:** UI가 한 페이지고, API 흐름을 먼저 검증해야 할 때
**Trade-offs:** 초반 속도는 빠르지만 파일이 커질 수 있으므로 phase 2에서 분리 기준을 명확히 둬야 한다

## Data Flow

### Request Flow

```text
[사용자 입력]
    ↓
[Single-page UI]
    ↓ fetch POST /synthesize
[FastAPI route]
    ↓
[Pydantic validation]
    ↓
[TTS provider adapter]
    ↓
[edge-tts mp3 생성]
    ↓
[ffmpeg mp3 -> wav 변환]
    ↓
[FileResponse 또는 StreamingResponse]
    ↓
[브라우저 다운로드]
```

### State Management

```text
[Browser form state]
    ↓
[fetch request payload]
    ↓
[stateless FastAPI request handler]
    ↓
[temporary files only]
```

### Key Data Flows

1. **Voice catalog flow:** 엔진 음성 목록 조회 -> 한국어만 필터링 -> UI 표시명으로 변환 -> `/voices` 응답
2. **Synthesis flow:** 텍스트/화자/속도 검증 -> 음성 합성 -> `WAV` 변환 -> 다운로드 응답
3. **Error flow:** 검증 실패 또는 엔진 실패 -> 사용자용 메시지로 정규화 -> UI에 표시

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | 단일 `FastAPI` 앱 + 동기 다운로드로 충분 |
| 1k-100k users | 음성 캐시, 작업 큐, 파일 저장소, 다운로드 분리 고려 |
| 100k+ users | API/worker 분리, 오브젝트 스토리지, 비동기 상태 조회, CDN 고려 |

### Scaling Priorities

1. **First bottleneck:** 음성 생성 시간과 변환 시간 — 긴 텍스트 제한, 큐, 비동기화로 해결
2. **Second bottleneck:** 임시 파일 I/O — 메모리 스트림 또는 외부 스토리지로 이동

## Anti-Patterns

### Anti-Pattern 1: 엔진 세부 구현을 API 계약에 노출

**What people do:** API 파라미터나 응답에 엔진 내부 이름과 MP3 흐름을 그대로 새겨 넣는다
**Why it's wrong:** 나중에 엔진 교체 시 클라이언트와 서버를 같이 뜯어고쳐야 한다
**Do this instead:** 클라이언트는 `voice`, `speed`, `format=wav` 같은 도메인 계약만 보게 한다

### Anti-Pattern 2: UI와 API를 별도 앱으로 조기 분리

**What people do:** 작은 프로토타입인데도 프런트엔드/백엔드를 따로 띄운다
**Why it's wrong:** CORS, 개발 서버, 배포 경로까지 불필요한 복잡도가 생긴다
**Do this instead:** phase 1은 단일 `FastAPI` 앱 안에서 끝낸다

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `edge-tts` | Python 라이브러리 비동기 호출 | API 키는 없지만 네트워크 연결은 필요하다 |
| `ffmpeg` | `subprocess` 호출 | 시작 시 존재 여부를 검사하거나 실패 메시지를 명확히 해야 한다 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ API | HTTP JSON / file response | 같은 앱 안에서 처리해 CORS를 피한다 |
| Route ↔ Provider | direct function/class call | phase 1에서는 간단한 함수 경계면 충분하다 |
| Provider ↔ Transcoder | local file path contract | MP3 출력과 WAV 변환 책임을 명확히 나눈다 |

## Sources

- `https://fastapi.tiangolo.com/advanced/custom-response/` — HTML 및 파일 응답 방식
- `https://fastapi.tiangolo.com/tutorial/static-files/` — 정적 파일 마운트 방식
- `https://pypi.org/project/fastapi/` — `main.py` 중심 빠른 시작과 Python 지원 범위
- `https://pypi.org/project/uvicorn/` — ASGI 실행 서버 선택 근거
- `https://pypi.org/project/edge-tts/` — 엔진 기능과 음성 목록 조회 확인
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py` — 실제 MP3 스트림 출력 구조 확인
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/docs/install.md` — 로컬 `WAV` 출력 대안 구조 확인

---
*Architecture research for: 한국어 TTS 프로토타입 웹 서비스*
*Researched: 2026-03-21*
