# Feature Research

**Domain:** 한국어 TTS 프로토타입 웹 서비스
**Researched:** 2026-03-21
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 한국어 텍스트 입력 | TTS 서비스의 최소 입력 수단이다 | LOW | 웹 UI와 API 모두 같은 입력 모델을 써야 한다 |
| 화자 목록 조회 및 선택 | 사용자는 목소리를 바꿔가며 결과를 비교하고 싶어 한다 | LOW | `/voices`가 UI 드롭다운의 데이터 원천이 된다 |
| 속도 조절 | TTS 서비스에서 가장 흔한 사용자 제어 항목이다 | LOW | 초기에는 범위를 좁게 고정해 품질 저하를 막는 편이 좋다 |
| 음성 생성 후 즉시 다운로드 | 결과를 파일로 가져가는 것이 서비스의 핵심 효용이다 | MEDIUM | `WAV` 변환과 응답 헤더가 맞아야 한다 |
| 기본 오류 처리 | 빈 텍스트, 지원되지 않는 화자, 잘못된 속도값은 즉시 안내되어야 한다 | LOW | `422` 자동 검증 + 의미 있는 `400` 메시지 조합이 좋다 |
| 최소 웹 UI | 일반 사용자가 API 도구 없이도 바로 시험해볼 수 있어야 한다 | LOW | 한 페이지면 충분하다 |
| 헬스체크 | 실행 가능성 검증과 디버깅의 시작점이다 | LOW | `/health`는 배포 전에도 중요하다 |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 한국어에 맞춘 화자 라벨링 | 원시 음성 ID보다 사람이 이해하기 쉬운 선택 경험을 준다 | MEDIUM | `ko-*` 음성만 필터링하고 친숙한 표시명을 붙인다 |
| 엔진 교체 가능한 내부 구조 | 초기 성공 후 품질/비용/오프라인 요구에 대응하기 쉽다 | MEDIUM | phase 1에서는 작게 시작하되 provider 경계를 남긴다 |
| 긴 텍스트 분할 처리 | 실제 사용성 확장에 가장 직접적인 기능이다 | MEDIUM | phase 1 이후 분할/병합 전략이 필요하다 |
| 생성 이력 | 반복 생성 시 편의성이 높다 | MEDIUM | DB 또는 파일 메타데이터 저장이 필요해 v1에서는 보류 |
| 비동기 작업 처리 | 긴 문장이나 무거운 로컬 모델에서 UX를 개선한다 | HIGH | 큐와 상태 조회가 필요하므로 v2 성격이다 |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 초기부터 계정/인증 | 사용자별 이력과 보호를 위해 자주 떠오른다 | 프로토타입 속도를 크게 늦추고 핵심 가치와 직접 연결되지 않는다 | 익명 체험형 v1 후 필요 시 추가 |
| 초기부터 DB 저장 이력 | 재다운로드와 관리가 편해 보인다 | 스키마, 파일 보관 정책, 정리 전략까지 한 번에 늘어난다 | v1은 즉시 다운로드만 제공 |
| 초기부터 작업 큐 | 무거운 TTS를 대비하고 싶어진다 | 인프라가 커지고 phase 1 최소 구조 원칙과 충돌한다 | 먼저 동기식 흐름으로 전체 검증 |
| 다페이지 프런트엔드 | 제품처럼 보이게 만들고 싶어진다 | 한 페이지 도구에는 과한 구조이며 유지비만 늘어난다 | 단일 페이지에 입력, 옵션, 결과를 집중 |
| 모든 언어 지원 | 범용 서비스처럼 보인다 | 한국어 품질 검증이 흐려지고 음성 필터링이 복잡해진다 | v1은 한국어 중심으로 제한 |

## Feature Dependencies

```text
[한국어 음성 생성]
    └──requires──> [화자 목록 조회]
                         └──requires──> [엔진 음성 메타데이터 필터링]

[WAV 다운로드]
    └──requires──> [음성 생성]
                         └──requires──> [MP3→WAV 변환]

[웹 UI]
    ├──requires──> [/voices]
    └──requires──> [/synthesize]

[엔진 교체 가능 구조] ──enhances──> [한국어 음성 생성]

[긴 텍스트 비동기 처리] ──conflicts──> [phase 1 단일 파일 최소 구조]
```

### Dependency Notes

- **한국어 음성 생성 requires 화자 목록 조회:** UI에서 사용 가능한 선택지를 보여주고, API에서도 허용 화자를 검증해야 한다.
- **WAV 다운로드 requires MP3→WAV 변환:** `edge-tts`를 v1 기본 엔진으로 쓰면 바로 `WAV`를 받지 못하므로 변환이 필수다.
- **웹 UI requires `/voices`, `/synthesize`:** UI는 자체 상태를 거의 가지지 않고 API를 직접 소비하는 편이 가장 단순하다.
- **엔진 교체 가능 구조 enhances 한국어 음성 생성:** 내부 경계가 있으면 `edge-tts`에서 `MeloTTS`/`coqui-tts`로 갈아타기 쉽다.
- **긴 텍스트 비동기 처리 conflicts with phase 1 최소 구조:** 큐, 작업 상태, 파일 보존 정책까지 동시에 필요해진다.

## MVP Definition

### Launch With (v1)

- [ ] 단일 페이지 웹 UI — 일반 사용자가 바로 텍스트를 입력하고 결과를 받기 위해 필수다
- [ ] `/health` — 서버 기동 상태를 즉시 확인하기 위해 필수다
- [ ] `/voices` — 화자 선택 UI와 API 사용성을 위해 필수다
- [ ] `/synthesize` — 서비스 핵심 동작이므로 필수다
- [ ] 한국어 텍스트 입력 검증 — 빈 문자열, 너무 긴 입력, 잘못된 타입을 방지해야 한다
- [ ] 화자 선택 — 성공 기준에 직접 포함된다
- [ ] 속도 선택 — 성공 기준에 직접 포함된다
- [ ] `WAV` 다운로드 — 산출물 전달 방식 자체가 제품 가치다
- [ ] 기본 오류 메시지 — 프로토타입이어도 실패 이유를 명확히 보여줘야 한다

### Add After Validation (v1.x)

- [ ] 화자 표시명 개선 — 사용자가 음성 ID를 몰라도 선택 가능하도록
- [ ] 긴 텍스트 분할 — 실제 문단 길이 입력이 늘어날 때 대응
- [ ] 엔진 추상화 분리 — phase 1 검증 후 `main.py`를 과도하게 키우지 않기 위해
- [ ] 임시 파일 정리 강화 — 재시도, 예외 상황, 다중 요청 대응 품질 향상

### Future Consideration (v2+)

- [ ] 생성 이력 — 반복 사용성 향상용이지만 저장소가 필요하다
- [ ] 비동기 작업/큐 — 긴 작업의 UX 개선
- [ ] 인증/관리자 기능 — 운영 단계에서만 의미가 있다
- [ ] 결제 — 프로토타입 단계 범위를 넘어선다

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `/health` | MEDIUM | LOW | P1 |
| `/voices` | HIGH | LOW | P1 |
| `/synthesize` | HIGH | MEDIUM | P1 |
| 단일 페이지 웹 UI | HIGH | LOW | P1 |
| 화자 선택 | HIGH | LOW | P1 |
| 속도 선택 | HIGH | LOW | P1 |
| `WAV` 다운로드 | HIGH | MEDIUM | P1 |
| 입력 검증과 오류 응답 | HIGH | LOW | P1 |
| 엔진 추상화 | MEDIUM | MEDIUM | P2 |
| 긴 텍스트 분할 | MEDIUM | MEDIUM | P2 |
| 생성 이력 | MEDIUM | MEDIUM | P3 |
| 비동기 큐 | LOW | HIGH | P3 |

**Priority key:**
- P1: 출시 최소 범위
- P2: 핵심 검증 후 바로 붙일 수 있는 확장
- P3: 제품화 단계에서 고려

## Competitor Feature Analysis

| Feature | 브라우저 내장/읽기 도구 | 상용 TTS 서비스들 | Our Approach |
|---------|-------------------------|------------------|--------------|
| 텍스트 입력 | 대부분 제공 | 대부분 제공 | 한 페이지 입력 폼으로 제공 |
| 화자 선택 | 보통 제공 | 거의 항상 제공 | `/voices` 기반 한국어 화자 선택 |
| 속도 조절 | 거의 항상 제공 | 거의 항상 제공 | 제한된 범위에서 안전하게 제공 |
| 즉시 다운로드 | 도구마다 다름 | 일반적으로 제공 | `WAV` 파일 즉시 응답 |
| API 접근 | 없는 경우 많음 | 대체로 제공 | 웹 UI와 함께 동일 기능 API 제공 |

## Sources

- `https://pypi.org/project/edge-tts/` — 음성 목록, 속도/볼륨/피치 조절, Python 사용 방식
- `https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py` — MP3 스트림 특성 확인
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/README.md` — 한국어 지원과 CPU 실시간 추론 성격 확인
- `https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/docs/install.md` — 한국어 `WAV` 출력과 속도 조절 예제 확인
- `https://fastapi.tiangolo.com/advanced/custom-response/` — HTML 및 파일 응답 패턴 확인

---
*Feature research for: 한국어 TTS 프로토타입 웹 서비스*
*Researched: 2026-03-21*
