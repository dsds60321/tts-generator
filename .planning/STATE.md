# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-21)

**Core value:** 사용자가 한국어 텍스트를 입력하고 원하는 화자와 속도를 선택했을 때, 자연스러운 음질의 `WAV` 음성을 안정적으로 즉시 생성해 다운로드할 수 있어야 한다.
**Current focus:** Phase 1 - `main.py` 합성 프로토타입

## Current Position

Phase: 1 of 5 (`main.py` 합성 프로토타입)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-03-21 — `ROADMAP.md` 생성 및 v1 요구사항 phase 매핑 완료

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: 0 min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | 0 | 0 min | - |

**Recent Trend:**
- Last 5 plans: none
- Trend: Stable

## Accumulated Context

### Decisions

Decisions are logged in `PROJECT.md` Key Decisions table.
Recent decisions affecting current work:

- [Phase 1] `main.py` 중심 최소 구조에서 핵심 한국어 TTS 합성 흐름을 먼저 닫는다
- [Phase 2] `/health`와 `/voices`는 합성 흐름 이후 별도 phase로 안정화한다
- [Phase 3] 웹 경험은 한 페이지 입력, 생성, 다운로드, 상태 표시로 묶는다
- [Phase 5] 엔진 교체 가능성은 v1 말미에 최소 공개 계약 보존 형태로 정리한다

### Pending Todos

None yet.

### Blockers/Concerns

- `edge-tts`는 무료·무키이지만 네트워크 의존이 있으므로 phase 1 계획에서 이 점을 명시해야 한다
- `WAV` 반환을 위해 `FFmpeg` 의존성과 오류 경험을 어떻게 드러낼지 phase 1 또는 phase 2에서 정해야 한다

## Session Continuity

Last session: 2026-03-21 12:02:49 KST
Stopped at: 세션 재개 완료, 다음 작업은 로드맵 승인 여부를 정리한 뒤 `Phase 1` 논의 또는 계획으로 이동
Resume file: None
