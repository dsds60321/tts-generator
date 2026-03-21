---
phase: 1
slug: main-py
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Phase 1 실행 중 피드백 샘플링과 최소 테스트 계약을 정의한다.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `pytest 9.0.2` + `fastapi.testclient` (`httpx 0.28.1`) |
| **Config file** | `none — Wave 0 installs` |
| **Quick run command** | `python -m pytest tests/test_main.py -q` |
| **Full suite command** | `python -m pytest -q` |
| **Estimated runtime** | ~5-10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/test_main.py -q`
- **After every plan wave:** Run `python -m pytest -q`
- **Before `$gsd-verify-work`:** Full suite must be green, then one manual `/synthesize` smoke run must pass
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| `01-01-01` | `01` provisional | `1` provisional | `API-03` | integration | `python -m pytest tests/test_main.py::test_synthesize_returns_wav_file_response -q` | ❌ Wave 0 | ⬜ pending |
| `01-01-02` | `01` provisional | `1` provisional | `SYN-01` | unit | `python -m pytest tests/test_main.py::test_synthesize_passes_text_to_provider -q` | ❌ Wave 0 | ⬜ pending |
| `01-01-03` | `01` provisional | `1` provisional | `SYN-02` | unit | `python -m pytest tests/test_main.py::test_synthesize_passes_selected_voice -q` | ❌ Wave 0 | ⬜ pending |
| `01-01-04` | `01` provisional | `1` provisional | `SYN-03` | unit | `python -m pytest tests/test_main.py::test_speed_maps_to_edge_rate -q` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Plan/wave 값은 planner가 실제 PLAN 문서를 만들 때 최종 확정한다.*

---

## Wave 0 Requirements

- [ ] `requirements.txt` — `fastapi[standard]`, `uvicorn`, `edge-tts`, `pytest`, `httpx` 고정
- [ ] `tests/test_main.py` — `API-03`, `SYN-01`, `SYN-02`, `SYN-03`를 검증하는 최소 테스트 작성
- [ ] 테스트용 monkeypatch fixture — 실제 네트워크/`ffmpeg` 호출 없이 route contract를 검증
- [ ] `pytest` / `httpx` 설치 — `pip install "pytest==9.0.2" "httpx==0.28.1"`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 실제 한국어 음성이 생성되고 로컬에서 재생된다 | `API-03`, `SYN-01`, `SYN-02`, `SYN-03` | 테스트에서는 provider와 `ffmpeg`를 mock 처리할 가능성이 높아 실제 오디오 품질과 실행 환경은 별도 확인이 필요하다 | 1. 의존성 설치 후 서버 실행 2. `POST /synthesize`로 한국어 텍스트, 허용 화자, 속도값 전송 3. 내려받은 `WAV` 파일이 재생되는지 확인 |
| `ffmpeg` 미설치 또는 변환 실패 시 서버가 디버깅 가능한 로그/오류를 남긴다 | `API-03` | background cleanup와 subprocess stderr는 자동 테스트보다 수동 확인이 빠르다 | 1. `ffmpeg` 경로를 일부러 깨뜨리거나 명령 실패를 유도 2. 응답과 로그에 원인 추적 정보가 남는지 확인 |

---

## Validation Sign-Off

- [ ] 모든 tasks가 `<automated>` 검증 또는 Wave 0 의존성을 가진다
- [ ] Sampling continuity: 3개 연속 task가 자동 검증 없이 진행되지 않는다
- [ ] Wave 0가 모든 `API-03`, `SYN-01`, `SYN-02`, `SYN-03` 검증 참조를 충족한다
- [ ] watch mode 플래그를 쓰지 않는다
- [ ] feedback latency < 10s
- [ ] `nyquist_compliant: true`는 실제 계획과 검증 매핑이 확정된 뒤에만 올린다

**Approval:** pending
