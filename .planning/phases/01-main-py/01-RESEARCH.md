# Phase 1: `main.py` 합성 프로토타입 - Research

**Researched:** 2026-03-21
**Domain:** `FastAPI` 기반 한국어 TTS 합성 프로토타입 (`edge-tts` + `FFmpeg`)
**Confidence:** HIGH

<user_constraints>
## User Constraints

`CONTEXT.md`는 없었다. 아래 제약은 사용자 프롬프트와 기존 planning 문서에서 확정된 내용이다.

### Locked Decisions
- 모든 사용자 응답과 planning 문서는 한국어로 작성한다
- 코드, 파일명, 경로, 명령어, API 경로만 영어를 유지한다
- 첫 구현은 `main.py` 단일 파일 또는 최소 파일 구조로 시작한다
- 실행 가능성과 전체 흐름 검증이 최우선이다
- `edge-tts`는 무료·무키이지만 네트워크 의존이라는 점을 숨기지 않는다
- `WAV` 반환을 위해 `FFmpeg` 변환 단계를 명시적으로 둔다
- `FFmpeg` 실패 UX를 이번 phase 계획에 포함한다

### Claude's Discretion
- 공개 요청의 `speed` 계약을 어떤 형태로 둘지 결정할 수 있다
- phase 1에서 지원할 한국어 화자 수와 기본 allowlist 범위를 정할 수 있다
- 테스트 전략에서 실제 네트워크 호출을 어느 정도 자동화할지 정할 수 있다

### Deferred Ideas (OUT OF SCOPE)
- `/health`
- `/voices`
- 웹 UI
- 전체 `4xx` 검증 완성
- 긴 텍스트 분할/병합
- 엔진 교체 추상화의 완성형 분리
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-03 | `/synthesize`에 텍스트, 화자, 속도를 보내고 `WAV` 파일을 HTTP 응답으로 받는다 | `Pydantic` 요청 모델, `edge-tts` MP3 생성, `FFmpeg` 변환, `FileResponse` 다운로드 패턴 |
| SYN-01 | 한국어 텍스트로 음성 생성을 요청할 수 있다 | JSON request body + `edge_tts.Communicate(...).save(...)` 비동기 호출 |
| SYN-02 | 지원되는 한국어 화자 중 하나를 선택할 수 있다 | 현재 phase에서는 공식 한국어 음성 목록을 근거로 한 정적 allowlist 권장 |
| SYN-03 | 허용된 범위 안에서 속도를 조절할 수 있다 | 공개 `speed` 값을 내부 `edge-tts` `rate` 문자열로 변환하는 adapter 패턴 |
</phase_requirements>

## Summary

Phase 1은 기능 수를 늘리는 단계가 아니라, `main.py` 하나로 "`POST /synthesize` -> 한국어 음성 생성 -> `WAV` 다운로드"를 실제로 닫는 단계다. 공식 문서와 현재 릴리스 기준으로 보면, 가장 빠르고 리스크가 낮은 경로는 `FastAPI` 요청 바디 모델로 `text`, `voice`, `speed`를 받고, `edge-tts`로 MP3를 만든 뒤, `FFmpeg`로 `WAV`로 변환해서 `FileResponse`로 반환하는 방식이다.

여기서 중요한 설계 포인트는 두 가지다. 첫째, `edge-tts`의 현재 공개 제어값은 `voice`, `rate`, `volume`, `pitch`이며 실제 오디오 출력은 MP3다. 따라서 `WAV`는 엔진이 아니라 API 경계에서 책임져야 한다. 둘째, 이 phase는 `/voices`나 웹 UI가 아니라 핵심 합성 흐름이 목표이므로, 화자 목록은 실시간 조회보다 정적 한국어 allowlist가 맞다. 동적 음성 조회는 network failure surface를 늘리고 Phase 2 범위와도 겹친다.

현재 워크스페이스에는 앱 코드, 패키지 설정, 테스트 인프라가 모두 없다. 반면 로컬 머신에는 `ffmpeg 8.0.1`이 이미 설치되어 있다. 따라서 계획에는 구현 코드만이 아니라 최소 의존성 파일, 실행 명령, `pytest` 기반 스모크 테스트, 그리고 `FFmpeg`/네트워크 실패를 읽기 쉬운 `5xx`로 감싸는 작업이 같이 들어가야 한다.

**Primary recommendation:** `main.py`의 `async` `POST /synthesize`에서 JSON body를 받아 `edge-tts`로 MP3를 저장하고, `asyncio.create_subprocess_exec()`로 `ffmpeg` 변환 후 `FileResponse(..., background=BackgroundTask(...))`로 `WAV`를 내려준다.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `FastAPI` | `0.135.1` | 단일 파일 API 앱, request body 파싱, 응답 문서화 | 공식 PyPI와 문서가 `main.py` 시작 흐름, `async def`, request body, 파일 응답 패턴을 직접 제공한다 |
| `Uvicorn` | `0.42.0` | ASGI 서버 실행 | 현재 최신 릴리스이며 Python `3.10`-`3.14`를 지원한다 |
| `edge-tts` | `7.2.7` | 한국어 음성 생성 엔진 | API 키 없이 화자 선택과 속도 제어가 가능하고, Python 모듈로 직접 호출할 수 있다 |
| `FFmpeg` | `8.x` | MP3 -> `WAV` 변환 | 현재 안정 릴리스는 `8.1`이고, 로컬 머신에는 `8.0.1`이 이미 설치되어 있어 phase 1에 바로 쓸 수 있다 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pytest` | `9.0.2` | phase 1 회귀 테스트 | `POST /synthesize` 응답 계약과 adapter 호출 확인에 사용 |
| `httpx` | `0.28.1` | `FastAPI` `TestClient` 의존성 | 공식 testing 문서 기준 `TestClient` 사용 시 설치 |
| `starlette.background.BackgroundTask` | bundled with `FastAPI`/`Starlette` | 응답 후 임시 파일 정리 | `FileResponse` 전송이 끝난 뒤 temp dir를 삭제할 때 사용 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 요청별 temp file + `FileResponse` | 메모리 기반 `StreamingResponse` | 메모리 스트리밍은 temp file을 줄이지만 `ffmpeg` 파일 변환 흐름과 정리가 더 복잡해진다 |
| phase 1 정적 한국어 allowlist | 앱 시작 시 `edge_tts.list_voices()` 조회 | 실시간 목록이 더 최신이지만 추가 네트워크 의존과 startup failure가 생기며 Phase 2 `/voices`와 중복된다 |
| 공개 `speed: float` 계약 | 공개 `rate: "+10%"` 문자열 계약 | `rate` 문자열은 구현이 단순하지만 provider 세부사항이 API에 새겨져 이후 엔진 교체를 어렵게 만든다 |

**Installation:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]==0.135.1" "uvicorn==0.42.0" "edge-tts==7.2.7" "pytest==9.0.2" "httpx==0.28.1"
ffmpeg -version
```

**Version verification:**
- `FastAPI 0.135.1` — released `2026-03-01`
- `Uvicorn 0.42.0` — released `2026-03-16`
- `edge-tts 7.2.7` — released `2025-12-12`
- `pytest 9.0.2` — released `2025-12-06`
- `httpx 0.28.1` — released `2024-12-06`
- `FFmpeg 8.1` — latest stable release `2026-03-16`; local machine check: `ffmpeg 8.0.1` at `/opt/homebrew/bin/ffmpeg`

## Architecture Patterns

### Recommended Project Structure
```text
.
├── main.py               # FastAPI app, request model, synthesis pipeline
├── requirements.txt      # pinned prototype dependencies
├── tests/
│   └── test_main.py      # phase 1 smoke/integration tests
└── README.md             # run command, ffmpeg requirement, scope note
```

### Pattern 1: Async Route + Thin Adapter
**What:** `/synthesize`는 request parsing과 response shaping만 맡고, 실제 음성 생성과 속도 변환은 helper 함수로 분리한다.
**When to use:** `edge-tts`가 `await` 기반 API를 제공하고, 이후 엔진 교체를 고려해 provider-specific detail을 route 밖으로 빼야 할 때
**Example:**
```python
# Source:
# - https://fastapi.tiangolo.com/tutorial/body/
# - https://fastapi.tiangolo.com/async/
# - https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py
from pydantic import BaseModel


class SynthesizeRequest(BaseModel):
    text: str
    voice: str
    speed: float = 1.0


def to_edge_rate(speed: float) -> str:
    # Inference: keep the public contract engine-agnostic, translate here.
    return f"{round((speed - 1.0) * 100):+d}%"
```

### Pattern 2: MP3 -> WAV Boundary Conversion
**What:** provider는 MP3를 만들고, API 경계에서 `ffmpeg`로 `WAV`로 변환한 뒤 내려준다.
**When to use:** 엔진은 `edge-tts`로 고정하되 공개 응답 계약은 `WAV`로 지켜야 할 때
**Example:**
```python
# Source:
# - https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py
# - https://docs.python.org/3/library/asyncio-subprocess.html
# - https://ffmpeg.org/ffmpeg.html
# - https://ffmpeg.org/ffmpeg-codecs.html
import asyncio
from pathlib import Path

import edge_tts


async def synthesize_mp3(text: str, voice: str, rate: str, mp3_path: Path) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(mp3_path))


async def transcode_to_wav(mp3_path: Path, wav_path: Path) -> None:
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-y",
        "-i",
        str(mp3_path),
        "-ar",
        "24000",
        "-ac",
        "1",
        str(wav_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(stderr.decode("utf-8", errors="ignore"))
```

### Pattern 3: FileResponse + Response-bound Cleanup
**What:** 응답 파일은 temp dir에 두고, response에 연결된 background task로만 정리한다.
**When to use:** DB/스토리지 없이 즉시 다운로드형 흐름을 구현할 때
**Example:**
```python
# Source:
# - https://fastapi.tiangolo.com/advanced/custom-response/
# - https://www.starlette.io/background/
# - https://www.starlette.io/responses/
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

app = FastAPI()


@app.post("/synthesize")
async def synthesize() -> FileResponse:
    temp_dir = Path(tempfile.mkdtemp(prefix="tts-"))
    wav_path = temp_dir / "speech.wav"
    return FileResponse(
        wav_path,
        media_type="audio/wav",
        filename="speech.wav",
        background=BackgroundTask(shutil.rmtree, temp_dir, ignore_errors=True),
    )
```

### Pattern 4: Static Korean Voice Allowlist for Phase 1
**What:** 이번 phase는 지원 화자를 `main.py` 상수로 고정한다.
**When to use:** `/voices`가 명시적으로 out of scope이고, 추가 네트워크 surface를 늘리고 싶지 않을 때
**Example:**
```python
# Source:
# - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
SUPPORTED_VOICES = {
    "ko-KR-SunHiNeural": "SunHi",
    "ko-KR-InJoonNeural": "InJoon",
    "ko-KR-JiMinNeural": "JiMin",
    "ko-KR-BongJinNeural": "BongJin",
}
```

### Anti-Patterns to Avoid
- **`.wav` 확장자만 붙인 MP3 응답:** 실제 포맷과 MIME 타입이 어긋나 재생 실패를 만든다.
- **`async def` 안에서 `subprocess.run()` 직접 호출:** `ffmpeg` 변환 동안 event loop가 막힌다.
- **`TemporaryDirectory()` context manager 안에서 `FileResponse` 반환:** 응답이 끝나기 전에 파일이 사라질 수 있다.
- **공개 API에 `edge-tts` `rate` 문자열을 그대로 노출:** provider 세부 구현이 공개 계약에 새겨진다.
- **화자 목록을 요청마다 live fetch:** scope가 넓어지고 실패 surface가 늘어난다.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MP3 -> `WAV` 변환 | 순수 Python 오디오 변환기, ad-hoc bytes 조작 | `ffmpeg` subprocess | 이미 검증된 변환기이며 exit code와 stderr가 명확하다 |
| 응답 후 cleanup 훅 | `try/finally`만으로 temp file 수명 관리 | `BackgroundTask` attached to response | 파일 전송 완료 이후에만 안전하게 정리할 수 있다 |
| 화자 discovery | Microsoft endpoint scraping, 자체 parser | phase 1 정적 allowlist, phase 2에 `edge_tts.list_voices()` | 현재 phase 목표에 비해 복잡하고 brittle하다 |
| SSML 확장 | 임의 SSML 템플릿 DSL | `edge-tts`의 `voice`/`rate`/`volume`/`pitch`만 사용 | 공식 docs에서 custom SSML 지원 제거를 명시한다 |

**Key insight:** phase 1은 "엔진을 잘 쓰는 것"이 핵심이지, 오디오 포맷 변환기나 voice catalog 시스템을 새로 만드는 단계가 아니다.

## Common Pitfalls

### Pitfall 1: Temp dir를 너무 일찍 지움
**What goes wrong:** 다운로드가 끝나기 전에 파일이 사라져 응답이 깨지거나 빈 파일이 내려간다.
**Why it happens:** `FileResponse`는 파일을 비동기적으로 전송하는데, `TemporaryDirectory()` context manager는 함수가 끝나는 즉시 cleanup된다.
**How to avoid:** `tempfile.mkdtemp()`로 요청별 디렉터리를 만들고, response에 연결된 `BackgroundTask`에서 `shutil.rmtree()`를 호출한다.
**Warning signs:** 로컬에서는 가끔 되고 가끔 실패하거나, 큰 파일에서만 깨진다.

### Pitfall 2: `async` route 안에서 blocking `ffmpeg` 호출
**What goes wrong:** 다른 요청까지 같이 느려지고 개발 중 체감상 서버가 멈춘 것처럼 보인다.
**Why it happens:** `subprocess.run()`은 blocking 호출이다.
**How to avoid:** `asyncio.create_subprocess_exec()` + `communicate()`를 사용하거나, route 전체를 sync `def` 전략으로 바꿀 때만 blocking I/O를 허용한다.
**Warning signs:** 한 요청 중 다른 엔드포인트도 느려지고, 테스트에서 타임아웃이 흔해진다.

### Pitfall 3: 공개 `speed` 계약이 엔진 세부사항에 묶임
**What goes wrong:** API 사용자가 `"+20%"` 같은 값을 보내게 되어 나중에 엔진 교체 시 계약이 깨진다.
**Why it happens:** `edge-tts` 내부 제어값을 곧바로 API로 노출하기 쉽기 때문이다.
**How to avoid:** 공개 입력은 `float` multiplier로 두고, adapter에서만 `edge-tts` 퍼센트 문자열로 변환한다.
**Warning signs:** 테스트나 문서에 `+10%`, `-25%` 문자열이 외부 계약처럼 등장한다.

### Pitfall 4: Phase 1에서 화자 discovery까지 같이 끝내려 함
**What goes wrong:** 핵심 합성 흐름보다 voice lookup과 라벨링이 더 큰 작업이 된다.
**Why it happens:** SYN-02를 구현하려다 `/voices`까지 같이 하게 되기 쉽다.
**How to avoid:** 이번 phase는 작은 allowlist만 두고, live discovery는 Phase 2로 명확히 미룬다.
**Warning signs:** `main.py`보다 voice catalog helper가 더 길어지거나 startup network call이 추가된다.

### Pitfall 5: cleanup 실패를 사용자 응답으로 막을 수 있다고 착각함
**What goes wrong:** 응답은 이미 성공했는데 background cleanup에서 예외가 나고 temp file만 계속 쌓인다.
**Why it happens:** Starlette background task는 response 전송 이후에 실행되므로, 그 시점 예외는 사용자 응답을 바꾸지 못한다.
**How to avoid:** cleanup task 내부 예외는 로깅하고, 개발 중 temp dir 누적 여부를 별도로 확인한다.
**Warning signs:** 사용자 입장에서는 성공인데 `/tmp` 또는 작업 디렉터리에 오디오 파일이 계속 남는다.

## Code Examples

Verified patterns from official sources:

### Request Body + Async Route Skeleton
```python
# Source:
# - https://fastapi.tiangolo.com/tutorial/body/
# - https://fastapi.tiangolo.com/async/
from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()


class SynthesizeRequest(BaseModel):
    text: str
    voice: str
    speed: float = 1.0


@app.post("/synthesize")
async def synthesize(payload: SynthesizeRequest):
    ...
```

### `edge-tts` MP3 Save
```python
# Source:
# - https://pypi.org/project/edge-tts/
# - https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py
import edge_tts


communicate = edge_tts.Communicate(
    "안녕하세요",
    "ko-KR-SunHiNeural",
    rate="+10%",
)
await communicate.save("speech.mp3")
```

### `WAV` Download Response with Cleanup
```python
# Source:
# - https://fastapi.tiangolo.com/advanced/custom-response/
# - https://www.starlette.io/background/
# - https://www.starlette.io/responses/
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask


return FileResponse(
    wav_path,
    media_type="audio/wav",
    filename="speech.wav",
    background=BackgroundTask(cleanup_temp_dir, temp_dir),
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| provider-native 오디오 포맷을 그대로 반환 | 공개 계약 포맷(`audio/wav`)을 API boundary에서 맞춘다 | `edge-tts 7.2.7` current source still emits MP3 | 엔진이 MP3여도 API는 `WAV` 계약을 유지할 수 있다 |
| blocking 중심 endpoint 구현 | library 특성에 맞춰 `async def` 또는 threadpool 전략을 의도적으로 선택 | current FastAPI concurrency guidance | `edge-tts` 같은 awaitable library와 더 잘 맞는다 |
| 자유로운 custom SSML 확장 기대 | library-supported prosody knobs만 사용 | current `edge-tts` docs remove custom SSML | phase 1 계획을 SSML 편집기로 키우지 않게 해준다 |

**Deprecated/outdated:**
- 임의 custom SSML 설계: `edge-tts` 공식 docs에서 custom SSML 지원 제거를 명시한다.
- provider-specific `rate` 문자열을 공개 API에 노출하는 방식: 후속 엔진 교체를 어렵게 만드는 outdated contract다.

## Open Questions

1. **공개 `speed` 범위를 어디까지 둘 것인가**
   - What we know: `edge-tts`는 퍼센트 문자열을 받지만, 요구사항은 engine-neutral한 "속도 조절"만 요구한다.
   - What's unclear: v1에서 어느 범위를 "허용된 범위"로 볼지 아직 문서화돼 있지 않다.
   - Recommendation: phase 1은 `0.5`-`2.0` multiplier를 공개 계약으로 두고, 내부에서 `-50%`-`+100%`로 변환한다.

2. **정적 allowlist에 몇 개의 한국어 화자를 넣을 것인가**
   - What we know: 공식 Microsoft voice support 페이지에는 현재 여러 `ko-KR-*Neural` 표준 음성이 있다.
   - What's unclear: phase 1에서 전부 열어둘지, 데모용 subset만 둘지 결정이 필요하다.
   - Recommendation: `SunHi`, `InJoon`, `JiMin`, `BongJin` 4개로 시작한다. 이유는 남/녀 화자와 이름 다양성을 주면서 request validation surface를 과하게 넓히지 않기 때문이다.

3. **로컬 Python 버전을 그대로 쓸지 낮출지**
   - What we know: 현재 로컬은 `Python 3.14.2`, `ffmpeg 8.0.1`이 설치돼 있고 앱 의존성은 아직 없다.
   - What's unclear: `edge-tts`를 포함한 실제 설치/런타임 검증은 아직 안 했다.
   - Recommendation: phase 실행은 우선 로컬 `python3`로 진행하되, 설치 호환성 문제가 생기면 바로 project venv를 `3.13` 또는 `3.12`로 내리는 fallback을 plan에 적어 둔다.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `pytest 9.0.2` + `fastapi.testclient` (`httpx 0.28.1`) |
| Config file | `none — see Wave 0` |
| Quick run command | `python -m pytest tests/test_main.py -q` |
| Full suite command | `python -m pytest -q` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-03 | `POST /synthesize`가 `audio/wav` 다운로드 응답을 반환한다 | integration | `python -m pytest tests/test_main.py::test_synthesize_returns_wav_file_response -q` | ❌ Wave 0 |
| SYN-01 | 한국어 텍스트가 provider helper로 전달된다 | unit | `python -m pytest tests/test_main.py::test_synthesize_passes_text_to_provider -q` | ❌ Wave 0 |
| SYN-02 | 선택한 화자가 그대로 provider helper로 전달된다 | unit | `python -m pytest tests/test_main.py::test_synthesize_passes_selected_voice -q` | ❌ Wave 0 |
| SYN-03 | 공개 `speed` 값이 내부 `edge-tts` `rate` 문자열로 변환된다 | unit | `python -m pytest tests/test_main.py::test_speed_maps_to_edge_rate -q` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `python -m pytest tests/test_main.py -q`
- **Per wave merge:** `python -m pytest -q`
- **Phase gate:** Full suite green + 실제 서버에서 한 번의 live `/synthesize` 수동 smoke (`curl` 또는 Swagger UI) 후 `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `requirements.txt` 또는 `pyproject.toml` — `FastAPI`, `Uvicorn`, `edge-tts`, `pytest`, `httpx` 고정
- [ ] `tests/test_main.py` — `API-03`, `SYN-01`, `SYN-02`, `SYN-03` 커버
- [ ] 테스트용 monkeypatch fixture — 실제 네트워크/`ffmpeg` 호출 없이 route contract 검증
- [ ] Framework install: `pip install "pytest==9.0.2" "httpx==0.28.1"` — 현재 저장소에 미설치

## Sources

### Primary (HIGH confidence)
- `https://pypi.org/project/fastapi/` - current release `0.135.1`, Python support, `main.py` example, `fastapi dev main.py`
- `https://fastapi.tiangolo.com/tutorial/body/` - request body model pattern
- `https://fastapi.tiangolo.com/advanced/custom-response/` - `FileResponse` semantics and filename/media type handling
- `https://fastapi.tiangolo.com/async/` - `async def` vs `def` guidance and threadpool behavior
- `https://fastapi.tiangolo.com/tutorial/background-tasks/` - background task lifecycle and usage
- `https://fastapi.tiangolo.com/tutorial/testing/` - `TestClient` + `httpx` testing pattern
- `https://pypi.org/project/uvicorn/` - current release `0.42.0`, Python support
- `https://pypi.org/project/edge-tts/` - current release `7.2.7`, voice/rate options, custom SSML removal
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py` - `Communicate.save`, MP3 output format, internal rate type, internal text chunking
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/voices.py` - official `list_voices()` Python API
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/util.py` - official CLI voice list formatting and stream loop example
- `https://docs.python.org/3/library/asyncio-subprocess.html` - async subprocess pattern for non-blocking `ffmpeg` execution
- `https://www.ffmpeg.org/download.html` - current stable `FFmpeg 8.1` release and dates
- `https://ffmpeg.org/ffmpeg.html` - command synopsis and file conversion behavior
- `https://ffmpeg.org/ffmpeg-codecs.html` - audio options such as sample rate (`ar`) and channels (`ac`)
- `https://www.starlette.io/background/` - `BackgroundTask` attached to response
- `https://www.starlette.io/responses/` - `FileResponse` behavior in Starlette
- `https://www.starlette.io/exceptions/` - background task exception timing caveat
- `https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support` - current official Korean voice list backing the phase 1 allowlist recommendation

### Secondary (MEDIUM confidence)
- 없음

### Tertiary (LOW confidence)
- 없음

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - current PyPI releases와 공식 문서를 확인했고 로컬 `ffmpeg` 설치도 실제로 확인했다
- Architecture: MEDIUM - 핵심 패턴은 공식 자료 기반이지만, 공개 `speed` 계약과 정적 allowlist 범위는 설계 판단이 포함된다
- Pitfalls: HIGH - `edge-tts` source, `FastAPI`/`Starlette` response lifecycle, `ffmpeg` runtime 특성이 직접 근거다

**Research date:** 2026-03-21
**Valid until:** 2026-04-20
