# Roadmap: 한국어 TTS 프로토타입 서비스

## Overview

이 로드맵은 `main.py` 중심의 최소 `FastAPI` 프로토타입에서 출발해, 한국어 텍스트를 `WAV`로 즉시 받는 핵심 합성 흐름을 먼저 닫고, 그 위에 서비스 상태 확인, 화자 조회, 한 페이지 웹 경험, 입력 검증, 엔진 교체 여지를 순서대로 얹는다. `granularity`가 `fine`이므로 각 phase는 하나의 검증 가능한 사용자 능력만 책임지도록 작게 나눴고, v1 범위를 넘는 장문 분할, 이력, 비동기 큐, 인증, 결제, 관리자 기능은 포함하지 않는다.

## Phases

**Phase 번호 규칙:**
- 정수 phase (`1`, `2`, `3`)는 계획된 milestone 작업이다
- 소수 phase (`2.1`, `2.2`)는 이후 긴급 삽입 작업이다

- [ ] **Phase 1: `main.py` 합성 프로토타입** - 단일 파일 중심 `FastAPI` 앱에서 한국어 TTS `WAV` 생성 흐름을 먼저 닫는다
- [ ] **Phase 2: 상태 확인과 화자 조회 API** - 서비스 상태와 지원 화자 목록을 외부에서 확인할 수 있게 한다
- [ ] **Phase 3: 한 페이지 웹 생성 경험** - 브라우저 한 화면에서 입력부터 다운로드까지 끝낸다
- [ ] **Phase 4: 입력 검증과 읽기 쉬운 실패 응답** - 잘못된 요청을 사용자 친화적인 `4xx` 메시지로 막는다
- [ ] **Phase 5: 엔진 교체 가능 경계 정리** - 내부 TTS 엔진을 바꿔도 공개 합성 계약을 유지할 수 있게 한다

## Phase Details

### Phase 1: `main.py` 합성 프로토타입
**Goal**: `main.py` 중심의 최소 구조로 한국어 텍스트, 화자, 속도를 받아 `WAV`를 즉시 반환하는 핵심 합성 흐름을 제공한다
**Depends on**: Nothing (first phase)
**Requirements**: API-03, SYN-01, SYN-02, SYN-03
**Success Criteria** (what must be TRUE):
  1. API 사용자는 한국어 텍스트를 보내 음성 생성을 요청할 수 있다
  2. API 사용자는 지원되는 한국어 화자 중 하나를 골라 결과 음성을 바꿀 수 있다
  3. API 사용자는 허용된 범위 안에서 속도를 조절해 빠르기가 반영된 결과를 받을 수 있다
  4. API 사용자는 하나의 `/synthesize` 요청으로 `WAV` 파일 응답을 바로 받을 수 있다
**Plans**: TBD

### Phase 2: 상태 확인과 화자 조회 API
**Goal**: 외부 클라이언트가 서비스 준비 상태와 지원 화자 목록을 안정적으로 확인할 수 있게 한다
**Depends on**: Phase 1
**Requirements**: API-01, API-02
**Success Criteria** (what must be TRUE):
  1. API 사용자는 `/health`를 호출해 서비스 상태를 JSON으로 확인할 수 있다
  2. API 사용자는 `/voices`를 호출해 선택 가능한 한국어 화자 목록을 `id`와 표시명으로 받을 수 있다
  3. API 사용자는 `/voices` 응답을 보고 바로 유효한 `/synthesize` 요청 값을 준비할 수 있다
**Plans**: TBD

### Phase 3: 한 페이지 웹 생성 경험
**Goal**: 브라우저 한 페이지에서 입력, 선택, 생성, 다운로드가 끊기지 않는 사용자 흐름을 제공한다
**Depends on**: Phase 1, Phase 2
**Requirements**: WEB-01, WEB-02, WEB-03
**Success Criteria** (what must be TRUE):
  1. 사용자는 한 페이지 화면에서 텍스트 입력, 화자 선택, 속도 선택, 생성 실행을 한 번에 할 수 있다
  2. 사용자는 생성이 성공하면 같은 화면에서 `WAV` 파일을 바로 다운로드할 수 있다
  3. 사용자는 생성이 진행되는 동안 로딩 상태를 읽기 쉬운 형태로 볼 수 있다
  4. 사용자는 생성이 실패하면 같은 화면에서 이해하기 쉬운 실패 메시지를 볼 수 있다
**Plans**: TBD

### Phase 4: 입력 검증과 읽기 쉬운 실패 응답
**Goal**: 잘못된 입력을 합성 전에 차단하고, API와 웹 모두에서 읽기 쉬운 `4xx` 오류 경험을 제공한다
**Depends on**: Phase 3
**Requirements**: VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. 사용자는 빈 문자열이나 공백만 있는 텍스트를 보내면 읽기 쉬운 메시지와 함께 `4xx` 응답을 받는다
  2. 사용자는 지원되지 않는 화자를 보내면 읽기 쉬운 메시지와 함께 `4xx` 응답을 받는다
  3. 사용자는 허용 범위를 벗어나거나 형식이 잘못된 속도 값을 보내면 읽기 쉬운 메시지와 함께 `4xx` 응답을 받는다
**Plans**: TBD

### Phase 5: 엔진 교체 가능 경계 정리
**Goal**: 내부 TTS 엔진을 바꾸더라도 `/synthesize` 공개 계약과 `WAV` 다운로드 흐름을 그대로 유지할 수 있게 한다
**Depends on**: Phase 4
**Requirements**: ARCH-01
**Success Criteria** (what must be TRUE):
  1. 개발자는 내부 TTS 엔진 구현을 교체하더라도 `/synthesize`의 공개 요청 필드와 `WAV` 응답 계약을 유지할 수 있다
  2. 기존 API 클라이언트와 웹 UI는 내부 엔진이 바뀌어도 같은 입력 필드와 다운로드 흐름으로 계속 동작한다
**Plans**: TBD

## Progress

**Execution Order:**
Phase는 숫자 순서대로 실행한다: `1 -> 2 -> 3 -> 4 -> 5`

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. `main.py` 합성 프로토타입 | 0/TBD | Not started | - |
| 2. 상태 확인과 화자 조회 API | 0/TBD | Not started | - |
| 3. 한 페이지 웹 생성 경험 | 0/TBD | Not started | - |
| 4. 입력 검증과 읽기 쉬운 실패 응답 | 0/TBD | Not started | - |
| 5. 엔진 교체 가능 경계 정리 | 0/TBD | Not started | - |
