# Pitfalls Research

**Domain:** 한국어 TTS 프로토타입 웹 서비스
**Researched:** 2026-03-21
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: 엔진 출력 형식을 잘못 가정함

**What goes wrong:**
`/synthesize`가 바로 `WAV`를 반환한다고 생각하고 구현했다가, 실제로는 MP3 스트림만 받아 응답 형식이 꼬이거나 깨진 파일을 내려준다.

**Why it happens:**
`edge-tts` README는 사용 예시를 중심으로 보여주고, 실제 전송 포맷이 MP3 고정이라는 사실은 소스 코드를 봐야 더 명확하다.

**How to avoid:**
phase 1에서 아예 `edge-tts mp3 생성 -> ffmpeg wav 변환 -> 다운로드 응답`을 명시적 파이프라인으로 잡는다.

**Warning signs:**
브라우저에서 내려받은 파일 확장자는 `.wav`인데 재생이 안 되거나, MIME 타입과 실제 포맷이 다르다.

**Phase to address:**
Phase 1

---

### Pitfall 2: 한국어 화자만 선별하지 않음

**What goes wrong:**
UI에 전체 음성 목록을 그대로 노출해 사용자가 비한국어 음성을 고르고, 발음이 이상하거나 실패한다.

**Why it happens:**
음성 목록 조회 자체는 쉽지만, 제품 관점의 필터링과 표시명 정리는 별도 작업으로 빠지기 쉽다.

**How to avoid:**
`/voices`에서 한국어 로캘만 먼저 필터링하고, 내부 음성 ID와 사용자 표시명을 분리한다.

**Warning signs:**
드롭다운에 언어가 뒤섞여 있거나, 한국어 입력인데 엉뚱한 발음이 나온다.

**Phase to address:**
Phase 1

---

### Pitfall 3: 입력 검증을 자동 검증에만 맡김

**What goes wrong:**
스키마는 통과했지만 빈 문자열, 공백만 있는 텍스트, 지나치게 긴 입력, 비정상 속도값을 제대로 막지 못한다.

**Why it happens:**
`FastAPI`의 기본 검증이 강력하니 제품 규칙까지 자동으로 처리될 것처럼 느껴진다.

**How to avoid:**
Pydantic 스키마 외에 서비스 규칙 검증을 추가한다. 예를 들면 공백 제거 후 빈 문자열 금지, 속도 범위 제한, 최대 글자 수 제한이다.

**Warning signs:**
합성이 오래 멈추거나, 엔진 예외가 그대로 사용자에게 노출되거나, 품질이 급격히 무너진다.

**Phase to address:**
Phase 1

---

### Pitfall 4: 임시 파일 정리를 빼먹음

**What goes wrong:**
요청이 누적될수록 MP3/WAV 임시 파일이 디스크에 쌓이고, 오래 지나면 용량 문제와 개인정보 노출 위험이 생긴다.

**Why it happens:**
프로토타입에서는 "일단 다운로드만 되면 됐다"라고 넘기기 쉽다.

**How to avoid:**
요청 단위 임시 디렉터리를 만들고, 응답 완료 후 정리하도록 설계한다. 오류 경로에서도 정리가 보장돼야 한다.

**Warning signs:**
`/tmp` 또는 프로젝트 디렉터리에 오디오 파일이 계속 남는다.

**Phase to address:**
Phase 1

---

### Pitfall 5: 네트워크 의존성을 숨긴 채 무료 엔진이라만 설명함

**What goes wrong:**
사용자는 "서비스 키가 없다 = 완전 로컬"로 이해했는데, 실제로는 `edge-tts`가 외부 네트워크에 의존해 오프라인 환경에서 실패한다.

**Why it happens:**
무료·무키와 오프라인은 다른 요구인데 쉽게 섞여서 해석된다.

**How to avoid:**
PROJECT/REQUIREMENTS/README에서 v1 엔진이 네트워크 기반이라는 점을 명시하고, 로컬 대안은 후속 phase로 분리한다.

**Warning signs:**
인터넷이 불안정할 때만 실패하고, 개발자는 원인을 재현하기 어렵다.

**Phase to address:**
Phase 1

---

### Pitfall 6: 긴 텍스트를 phase 1에서 무리하게 처리함

**What goes wrong:**
문단 단위까지만 검증하면 되는 단계에서 장문 분할, 병합, 비동기화까지 한 번에 넣다가 구현이 커진다.

**Why it happens:**
실사용을 미리 대비하고 싶어서다. 하지만 이 프로젝트는 먼저 실행 가능한 전체 흐름 검증이 우선이다.

**How to avoid:**
phase 1은 길이 제한을 두고 짧은 요청만 안정적으로 처리한다. 긴 텍스트 분할은 별도 phase로 분리한다.

**Warning signs:**
`main.py`가 급격히 커지고, 음성 생성보다 텍스트 분할 로직이 더 복잡해진다.

**Phase to address:**
Phase 2

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 모든 로직을 `main.py`에 유지 | 가장 빠르게 시작할 수 있다 | 파일이 급격히 커지면 엔진 교체와 테스트가 어려워진다 | phase 1까지만 허용 |
| HTML/JS를 문자열로 인라인 유지 | 파일 수를 줄일 수 있다 | UI가 조금만 커져도 수정성이 떨어진다 | 한 페이지 프로토타입에서는 허용 |
| 화자 ID를 하드코딩 | 구현 속도가 빠르다 | 서비스 쪽 음성 목록 변화에 취약하다 | 데모용 한시적 허용, `/voices` 도입 후 제거 |
| `ffmpeg` 오류를 그대로 노출 | 구현이 단순하다 | 사용자 경험이 나쁘고 디버깅 메시지가 새어 나간다 | 허용하지 않음 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `edge-tts` | `WAV`를 직접 받을 수 있다고 가정 | MP3 생성 후 `ffmpeg`로 변환 |
| `edge-tts` 음성 목록 | 전체 음성 목록을 UI에 그대로 노출 | 한국어 음성만 필터링하고 표시명 구성 |
| `ffmpeg` | 설치 여부를 확인하지 않고 런타임 실패 | 시작 시 존재 확인 또는 실패 메시지 명확화 |
| `FileResponse` | 응답 후 파일 정리를 누락 | 백그라운드 정리 또는 임시 디렉터리 수명 관리 |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 장문 동기 합성 | 응답 시간이 급격히 길어짐 | 입력 길이 제한, 후속 phase에서 분할/큐 도입 | 수천 자 입력부터 체감 |
| 요청마다 음성 목록 재조회 | `/voices`가 느려짐 | 앱 기동 후 캐시하거나 적절히 재사용 | 동시 요청이 늘면 더 눈에 띔 |
| 무거운 로컬 모델을 즉시 도입 | 기동 시간이 길고 CPU 사용량 급증 | v1은 가벼운 네트워크 기반 엔진 사용 | 일반 노트북 CPU에서 바로 체감 |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| 텍스트 길이 제한 없음 | 자원 고갈, 느린 응답, 서비스 남용 | 최대 글자 수 제한과 요청 타임아웃 |
| 예측 가능한 임시 파일명 사용 | 다른 요청 파일 노출 위험 | 안전한 임시 디렉터리/파일 생성 |
| 내부 예외를 그대로 반환 | 환경 정보와 구현 세부 유출 | 사용자용 오류 메시지로 변환 |
| 생성 파일을 장기 보관 | 개인정보 및 스토리지 누적 위험 | 즉시 다운로드 후 삭제 |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 음성 ID를 그대로 노출 | 어떤 화자인지 이해하기 어렵다 | 표시명과 원본 ID를 분리 |
| 로딩 상태 없음 | 버튼을 여러 번 눌러 중복 요청을 만든다 | 생성 중 상태와 버튼 비활성화 |
| 실패 메시지가 기술적임 | 일반 사용자가 원인을 이해 못 한다 | 입력 문제와 서버 문제를 분리해 안내 |
| 다운로드 파일명이 무의미함 | 여러 결과를 비교하기 어렵다 | 화자/타임스탬프를 포함한 파일명 사용 |

## "Looks Done But Isn't" Checklist

- [ ] **`/voices`:** 한국어 음성만 반환하는지 확인
- [ ] **`/synthesize`:** 빈 텍스트와 잘못된 속도를 의미 있는 `4xx`로 막는지 확인
- [ ] **`WAV` 다운로드:** 내려받은 파일이 실제로 `macOS`와 `Linux`에서 재생되는지 확인
- [ ] **임시 파일:** 성공/실패 후에도 정리되는지 확인
- [ ] **UI:** 생성 중 중복 클릭과 오류 표시가 처리되는지 확인
- [ ] **헬스체크:** 엔진 또는 `ffmpeg` 문제가 있을 때 최소한 원인 추적이 가능한지 확인

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| MP3/WAV 형식 혼선 | LOW | 변환 파이프라인과 응답 헤더를 재점검하고 테스트 추가 |
| 잘못된 화자 노출 | LOW | `/voices` 필터 로직 수정 후 UI 새로고침 |
| 임시 파일 누수 | MEDIUM | 임시 디렉터리 전략으로 바꾸고 정리 훅 추가 |
| 과도한 장문 처리 | MEDIUM | 길이 제한을 먼저 넣고 긴 텍스트는 후속 phase로 이동 |
| 엔진 네트워크 실패 | MEDIUM | 사용자 메시지 개선, 재시도 정책 검토, 로컬 대안 phase 추가 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 엔진 출력 형식 오해 | Phase 1 | 다운로드한 `WAV` 실제 재생 확인 |
| 한국어 화자 미필터링 | Phase 1 | `/voices` 응답에 비한국어가 없는지 확인 |
| 입력 검증 부족 | Phase 1 | 빈 문자열/이상 속도에 `4xx` 응답 확인 |
| 임시 파일 누수 | Phase 1 | 요청 후 임시 파일 잔존 여부 확인 |
| 네트워크 의존 숨김 | Phase 1 | README와 health/error 메시지에 반영 |
| 긴 텍스트 조기 확장 | Phase 2 | 길이 제한과 분할 phase 분리 여부 확인 |

## Sources

- `https://pypi.org/project/edge-tts/` — 음성 목록 및 조절 옵션
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py` — MP3 출력 형식, 스트림 구조
- `https://fastapi.tiangolo.com/advanced/custom-response/` — 파일 응답 패턴
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/docs/install.md` — 로컬 대안과 속도 조절 가능성
- `https://raw.githubusercontent.com/OHF-Voice/piper1-gpl/main/docs/VOICES.md` — 한국어 부재 확인

---
*Pitfalls research for: 한국어 TTS 프로토타입 웹 서비스*
*Researched: 2026-03-21*
