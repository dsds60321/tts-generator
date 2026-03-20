# Project Research Summary

**Project:** 한국어 TTS 프로토타입 서비스
**Domain:** 한국어 텍스트-음성 변환 웹 서비스
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

이 프로젝트는 일반 사용자가 브라우저에서 한국어 텍스트를 입력하고, 화자와 속도를 고른 뒤, 자연스러운 음질의 음성을 `WAV` 파일로 바로 내려받는 프로토타입이다. 조사 결과, phase 1에서는 `FastAPI` 단일 앱 안에 웹 UI와 API를 함께 두고, 음성 생성 엔진은 `edge-tts`, 파일 형식 변환은 `FFmpeg`를 쓰는 조합이 가장 빠르게 성공 기준에 도달한다.

핵심 이유는 세 가지다. 첫째, `FastAPI`는 `main.py` 단일 파일로도 입력 검증, JSON API, 파일 응답, 자동 문서를 한 번에 처리하기 좋다. 둘째, `edge-tts`는 API 키 없이 음성 목록 조회와 속도 조절을 지원해 초기 품질과 사용성을 빠르게 확인하기 좋다. 셋째, 공식 소스 기준 출력이 MP3이므로 `WAV` 다운로드 요구는 `FFmpeg` 변환 단계를 명시적으로 두는 편이 가장 안정적이다.

가장 큰 리스크는 "무료·무키"와 "완전 로컬"을 혼동하는 것이다. `edge-tts`는 무료이고 키는 없지만 네트워크 의존이 있다. 따라서 v1 문서와 health/error 처리에서 이 점을 숨기지 말아야 하며, 이후 오프라인 또는 모델 소유권이 중요해지면 `MeloTTS`나 `coqui-tts` 같은 로컬 엔진 대안을 붙일 수 있도록 provider 경계를 준비하는 것이 좋다.

## Key Findings

### Recommended Stack

v1의 추천 조합은 `Python 3.11`, `FastAPI 0.135.1`, `Uvicorn 0.41.0`, `edge-tts 7.2.7`, `FFmpeg 8.0`이다. 이 조합은 한 파일 중심 시작, 브라우저와 API 동시 제공, 화자/속도 제어, `WAV` 다운로드라는 현재 요구와 가장 잘 맞는다.

특히 `edge-tts`는 공식 README에서 음성 목록 조회와 `rate`/`volume`/`pitch` 조절을 지원하고, 공식 소스에서는 실제 오디오 출력이 MP3 스트림으로 고정됨을 확인할 수 있다. 이 덕분에 v1 구현에서 무엇을 어디까지 해야 하는지가 명확하다. 로컬 대안으로는 `MeloTTS`가 한국어와 `WAV` 출력, 속도 조절을 바로 지원하고, 더 무거운 상위 대안으로는 `coqui-tts`가 있다.

**Core technologies:**
- `FastAPI`: 단일 파일에서도 UI와 API를 함께 제공하기 좋다
- `edge-tts`: 무료·무키 기반의 자연스러운 음성 생성과 화자/속도 제어를 제공한다
- `FFmpeg`: MP3를 `WAV`로 안전하게 변환한다

### Expected Features

이 도메인에서 사용자가 기본적으로 기대하는 기능은 한국어 텍스트 입력, 화자 선택, 속도 조절, 즉시 다운로드, 기본 오류 처리, 최소 웹 UI다. 사용자는 자동 문서보다도 "입력 -> 생성 -> 다운로드" 흐름이 끊기지 않는지를 먼저 체감한다.

**Must have (table stakes):**
- 한국어 텍스트 입력과 기본 검증 — 사용자가 바로 시도할 수 있어야 한다
- 화자 선택과 속도 선택 — 성공 기준에 직접 포함된다
- `/health`, `/voices`, `/synthesize` — 구현과 검증의 최소 API 세트다
- `WAV` 즉시 다운로드 — 결과 전달 방식이 핵심이다
- 단일 페이지 웹 UI — 일반 사용자가 바로 쓸 수 있어야 한다

**Should have (competitive):**
- 한국어 중심 화자 라벨링 — 음성 ID를 사람이 이해하기 쉬운 형태로 보여주기
- 엔진 교체 가능한 내부 구조 — 품질과 비용, 오프라인 요구 변화에 대응

**Defer (v2+):**
- 생성 이력 — 저장 계층이 필요하다
- 비동기 큐 — 장문/무거운 모델 대응용
- 인증, 결제, 관리자 기능 — 현재 핵심 가치와 직접 관련 없다

### Architecture Approach

phase 1 구조는 하나의 `FastAPI` 앱 안에 단일 페이지 UI, `/health`, `/voices`, `/synthesize`, 간단한 provider 경계, 임시 파일 정리, `FFmpeg` 변환 흐름을 모두 두는 방식이 적합하다. 이는 최소 구조 원칙을 지키면서도 나중에 `providers.py`나 `static/`으로 분리할 여지를 남긴다.

**Major components:**
1. UI route — 단일 페이지 입력 화면 제공
2. Voice catalog service — 한국어 화자 목록 필터링과 표시명 구성
3. Synthesis route/provider — 텍스트 검증, 음성 생성, `WAV` 변환, 다운로드 응답
4. Temp file cleanup — 프로토타입이라도 파일 누수를 막는 최소 안전장치

### Critical Pitfalls

1. **엔진 출력 형식 오해** — `edge-tts`는 MP3 기반이므로 `WAV` 변환 단계를 반드시 넣어야 한다
2. **한국어 화자 미필터링** — `/voices`에서 전체 목록을 그대로 노출하지 말아야 한다
3. **입력 검증 부족** — 빈 텍스트, 과도한 길이, 속도 범위를 별도로 막아야 한다
4. **임시 파일 누수** — 성공/실패 경로 모두에서 정리 전략이 필요하다
5. **네트워크 의존 숨김** — 무료·무키와 오프라인은 다르다는 점을 문서와 오류 처리에 드러내야 한다

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: 단일 파일 프로토타입
**Rationale:** 가장 먼저 핵심 가치인 "한국어 입력 -> 화자/속도 선택 -> `WAV` 다운로드"를 검증해야 한다.
**Delivers:** `main.py` 기반 `FastAPI` 앱, 단일 페이지 UI, `/health`, `/voices`, `/synthesize`
**Addresses:** 핵심 table stakes 전부
**Avoids:** 과한 구조 분리, 조기 인프라 확대

### Phase 2: 경계 정리와 품질 보강
**Rationale:** phase 1 성공 후에는 엔진 교체 가능성과 유지보수성을 보강해야 한다.
**Delivers:** provider 추상화 분리, 화자 라벨링 개선, 임시 파일/오류 처리 정리
**Uses:** `FastAPI` 응답 패턴, 엔진 어댑터 경계
**Implements:** service/provider boundary

### Phase 3: 긴 텍스트와 사용자 편의 확장
**Rationale:** 실제 사용성 확대는 핵심 흐름 안정화 후 진행해야 한다.
**Delivers:** 긴 텍스트 분할, 생성 이력, 필요 시 비동기 작업 기반

### Phase Ordering Rationale

- `WAV` 다운로드는 음성 생성과 변환이 완성돼야 하므로 가장 먼저 검증한다.
- 화자 목록과 속도 조절은 UI와 API 계약의 기본 축이라 phase 1에 함께 들어가야 한다.
- 엔진 교체 가능 구조는 중요하지만 phase 1 이전에 크게 분리하면 속도가 떨어지므로 phase 2가 적절하다.
- 긴 텍스트 분할과 이력은 핵심 검증 이후에 붙여야 복잡도를 통제할 수 있다.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** 실제 한국어 화자 목록 필터 기준과 `ffmpeg` 배포 의존성 처리 방식
- **Phase 3:** 긴 텍스트 분할 기준, 요청 시간 제한, 비동기 작업 UX

Phases with standard patterns (skip research-phase):
- **Phase 2:** provider 분리, 오류 응답 정리, UI 라벨링 개선은 비교적 표준적인 리팩터링 패턴이다

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 공식 문서와 PyPI/공식 소스를 기반으로 확인했다 |
| Features | HIGH | 사용자 요구와 도메인 일반 기대치가 잘 맞아 떨어진다 |
| Architecture | HIGH | `FastAPI` 단일 앱 패턴과 현재 범위가 명확하다 |
| Pitfalls | HIGH | 엔진 출력 형식, 네트워크 의존, 파일 정리 등 구체적 리스크가 분명하다 |

**Overall confidence:** HIGH

### Gaps to Address

- 한국어 화자 목록의 실제 반환 형태 — 구현 phase에서 실제 조회 결과를 기준으로 표시명 정책을 확정
- `FFmpeg` 시스템 설치 확인 UX — health 응답에 어디까지 노출할지 plan phase에서 결정
- 오프라인 대안 우선순위 — `MeloTTS`와 `coqui-tts` 중 어떤 축으로 갈지는 phase 2 이후 실제 품질과 운영 제약을 보고 결정

## Sources

### Primary (HIGH confidence)
- `https://pypi.org/project/fastapi/` — 최신 릴리스, Python 지원 범위, 설치 방식
- `https://fastapi.tiangolo.com/advanced/custom-response/` — HTML/파일 응답 패턴
- `https://fastapi.tiangolo.com/tutorial/static-files/` — 정적 파일 마운트 방식
- `https://pypi.org/project/uvicorn/` — 최신 서버 릴리스
- `https://pypi.org/project/edge-tts/` — 최신 릴리스, 음성 목록, 속도 조절
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py` — MP3 고정 출력 확인
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/README.md` — 한국어 지원과 CPU 실시간 추론 성격
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/docs/install.md` — 로컬 설치, 속도 조절, 한국어 `WAV` 예제
- `https://pypi.org/project/coqui-tts/` — 로컬 고급 대안의 최신 릴리스와 요구사항
- `https://raw.githubusercontent.com/OHF-Voice/piper1-gpl/main/docs/VOICES.md` — 한국어 공식 음성 부재

### Secondary (MEDIUM confidence)
- `https://ffmpeg.org/pipermail/ffmpeg-devel/2025-August/347916.html` — `FFmpeg 8.0` 릴리스 공지

### Tertiary (LOW confidence)
- 없음

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
