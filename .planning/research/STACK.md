# Stack Research

**Domain:** 한국어 TTS 프로토타입 웹 서비스
**Researched:** 2026-03-21
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.11 권장 | 애플리케이션 런타임 | `FastAPI`, `edge-tts`, 향후 `coqui-tts` 대안까지 무리 없이 소화할 수 있는 안정적인 기준선이다. 공식 문서 기준 `FastAPI`와 `coqui-tts` 모두 Python 3.10+를 지원하므로, `3.11`이 `macOS`/`Linux` 공통 운영에 가장 무난하다. |
| FastAPI | 0.135.1 | 웹 UI와 API를 함께 제공하는 ASGI 프레임워크 | 공식 문서가 `main.py` 단일 파일 시작 흐름을 잘 지원하고, 타입 기반 검증과 OpenAPI 문서가 기본 제공되어 프로토타입 검증 속도가 빠르다. |
| Uvicorn | 0.41.0 | ASGI 서버 실행 | `FastAPI`의 기본 실행 경로이며, 개발 시 `reload`, 운영 시 단일 프로세스 실행으로 바로 이어진다. |
| edge-tts | 7.2.7 | v1 한국어 음성 생성 엔진 | API 키 없이 사용할 수 있고, 공식 README에서 음성 목록 조회와 `rate`/`volume`/`pitch` 조절을 지원한다. 초기 자연스러운 음질과 화자 선택 요구를 가장 빠르게 만족시키기 좋다. |
| FFmpeg | 8.0 | `edge-tts` 결과를 `WAV`로 변환 | `edge-tts` 공식 소스에서 출력 포맷이 `audio-24khz-48kbitrate-mono-mp3`로 고정되어 있으므로, `WAV` 다운로드 요구를 만족하려면 안정적인 변환기가 필요하다. `FFmpeg`가 가장 표준적이다. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Pydantic | FastAPI 포함 버전 | 요청 본문 검증, `4xx/422` 오류 응답 기반 | `/synthesize` 입력 스키마와 속도 범위 검증에 사용한다. |
| Jinja2 | FastAPI `standard` extras 포함 | 나중에 UI를 `main.py` 밖으로 분리할 때 템플릿 렌더링 | phase 1에서는 인라인 `HTMLResponse`로 시작하고, phase 2 이후 템플릿 분리 시 도입한다. |
| Coqui TTS | 0.27.5 | 향후 로컬 고품질/모델 교체 대안 | 네트워크 의존 없는 엔진이나 음성 복제, 더 무거운 모델 선택이 필요해질 때 검토한다. |
| MeloTTS | 저장소 기준 설치 | 로컬 `WAV` 출력이 쉬운 한국어 대안 엔진 | 완전 로컬 실행이 중요해지고, 한국어 화자 수 제한을 감수할 수 있을 때 사용한다. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `venv` 또는 `uv` | 가상환경과 의존성 격리 | 문서와 재현성을 위해 어떤 도구를 쓰든 고정된 `requirements` 또는 `pyproject.toml`을 남겨야 한다. |
| `curl` | `/health`, `/voices`, `/synthesize` 빠른 점검 | 브라우저 UI 검증과 별개로 API 회귀 확인에 유용하다. |
| 브라우저 개발자 도구 | UI 네트워크 흐름 확인 | `fetch` 요청, 다운로드 응답 헤더, 오류 메시지를 즉시 확인할 수 있다. |

## Installation

```bash
# Core
python3.11 -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]==0.135.1" "uvicorn==0.41.0" "edge-tts==7.2.7"

# System dependency for WAV conversion
# macOS (Homebrew)
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ffmpeg
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `edge-tts` | `MeloTTS` | 외부 네트워크 의존이 불가하고, 한국어 화자 수가 적어도 괜찮다면 `MeloTTS`가 더 단순하다. 공식 예제 기준 한국어 `WAV` 출력과 속도 조절은 바로 가능하다. |
| `edge-tts` | `coqui-tts` (`xtts_v2`) | 고품질 로컬 모델, 음성 복제, 모델 교체 유연성이 더 중요해지고 무거운 설치 비용을 감수할 수 있을 때 적합하다. |
| `FastAPI` | `Flask` | HTML 폼만 있는 초간단 데모라면 가능하지만, API 계약과 입력 검증, 자동 문서까지 고려하면 현재 요구에는 `FastAPI`가 낫다. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `Piper`를 v1 한국어 주 엔진으로 선택 | 공식 음성 목록에 한국어가 없다. 현재 프로젝트의 핵심 요구인 한국어 자연 음질과 화자 선택을 바로 만족시키기 어렵다. | `edge-tts`를 v1 기본 엔진으로 두고, 로컬 엔진 검토는 `MeloTTS`/`coqui-tts`로 미룬다. |
| 초기부터 `React`/`Next.js` 도입 | 한 페이지 프로토타입 범위에 비해 구조가 커지고, `main.py` 중심 최소 구조 원칙과 충돌한다. | `FastAPI`에서 단일 HTML 페이지 또는 아주 작은 정적 파일로 시작한다. |
| `pydub`를 핵심 변환기로 의존 | 실제 MP3 디코딩은 결국 `ffmpeg`에 기대는 경우가 많고, 문제 원인 파악이 한 단계 더 복잡해진다. | `ffmpeg`를 직접 호출해 변환 결과와 오류를 명확히 제어한다. |
| phase 1에서 무거운 로컬 모델을 기본값으로 채택 | 자연스러운 음질은 좋을 수 있지만 설치 용량, 기동 시간, CPU 부담이 커져 실행 가능성 검증이 느려진다. | phase 1은 `edge-tts`, phase 2 이후 엔진 추상화 뒤 로컬 모델 검토 |

## Stack Patterns by Variant

**If v1 우선순위가 "빠른 성공과 자연스러운 한국어 품질"이라면:**
- `FastAPI + edge-tts + ffmpeg`
- 이유: 음성 품질과 화자 선택을 가장 짧은 구현으로 검증할 수 있다.

**If 향후 우선순위가 "완전 로컬 실행"으로 바뀐다면:**
- `FastAPI + provider abstraction + MeloTTS 또는 Coqui TTS`
- 이유: API 계약은 유지하면서 엔진만 교체할 수 있게 준비해둘 수 있다.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `fastapi==0.135.1` | Python `>=3.10` | PyPI 기준 Python 3.10-3.14 지원 |
| `uvicorn==0.41.0` | Python `>=3.10` | 최신 PyPI 릴리스 기준 Python 3.10-3.14 지원 |
| `edge-tts==7.2.7` | Python 3 | PyPI 기준 `py3-none-any`; 엔진 특성상 네트워크 연결 필요 |
| `coqui-tts==0.27.5` | Python `>=3.10,<3.15`, PyTorch 2.2+ | 로컬 대안으로는 강력하지만 v1 기본값으로는 무겁다 |
| `FFmpeg 8.0` | `macOS`/`Linux` 시스템 설치 | Python 패키지가 아니라 OS 레벨 의존성이므로 실행 전 존재 확인이 필요하다 |

## Sources

- `https://pypi.org/project/fastapi/` — `FastAPI 0.135.1`, Python 요구사항, `fastapi[standard]` 설치 방식 확인
- `https://fastapi.tiangolo.com/tutorial/static-files/` — 정적 파일 마운트 방식 확인
- `https://fastapi.tiangolo.com/advanced/custom-response/` — `HTMLResponse`, `FileResponse` 사용 패턴 확인
- `https://pypi.org/project/uvicorn/` — `Uvicorn 0.41.0` 릴리스 확인
- `https://pypi.org/project/edge-tts/` — `edge-tts 7.2.7`, 음성 목록 조회, 속도/음량/피치 조절 확인
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py` — 출력 포맷이 MP3(`audio-24khz-48kbitrate-mono-mp3`)로 고정됨을 확인
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/README.md` — 한국어 지원, CPU 실시간 추론 성향, MIT 라이선스 확인
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/docs/install.md` — `macOS`/`Linux` 설치, 한국어 `WAV` 출력, 속도 조절 예제 확인
- `https://pypi.org/project/coqui-tts/` — `coqui-tts 0.27.5`, Python 지원 범위, 로컬 고급 대안 확인
- `https://raw.githubusercontent.com/OHF-Voice/piper1-gpl/main/docs/VOICES.md` — 공식 음성 목록에 한국어가 없음을 확인
- `https://ffmpeg.org/pipermail/ffmpeg-devel/2025-August/347916.html` — `FFmpeg 8.0` 공식 릴리스 공지 확인

---
*Stack research for: 한국어 TTS 프로토타입 웹 서비스*
*Researched: 2026-03-21*
