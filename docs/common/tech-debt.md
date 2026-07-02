# 기술 부채 & 변경 이력

> 측정일: 2026-06-22
> 수치는 스프린트 시작/종료 시 갱신한다.

---

## 1. 백엔드 컨벤션 위반 현황

### 측정 요약

| # | 항목 | 위반 건수 |
|---|------|:-------:|
| 1 | 메서드 길이 > 20줄 | **12건** |
| 2 | 클래스 길이 > 200줄 | **1건** |
| 3 | `return null` 사용 | **3건** |
| 4 | 빈 catch 블록 | 0건 ✅ |
| 5 | Tell Don't Ask 위반 | 0건 ✅ |
| 6 | 3단계 이상 메서드 체인 | **3건** |
| 7 | 매직 스트링/숫자 | **12건** |
| 8 | import 스타일 위반 | **5건** |
| | **합계** | **36건** |

---

### 세부 내역

#### 1. 메서드 길이 > 20줄 (12건)

| 라인 수 | 파일 | 메서드명 |
|:------:|------|---------|
| 98줄 | `infra/ocr/NaverOcrApiClient.java:105` | `parseOcrResponse` |
| 43줄 | `infra/ocr/NaverOcrApiClient.java:45` | `callOcrApi` |
| 35줄 | `domain/session/service/SessionService.java:44` | `createSession` |
| 34줄 | `domain/session/service/SessionRenewService.java:38` | `renew` |
| 33줄 | `domain/team/service/TeamConfigureService.java:124` | `buildConfigureState` |
| 32줄 | `domain/session/service/SessionService.java:83` | `startSession` |
| 30줄 | `infra/ocr/NaverOcrApiClient.java:369` | `mergeSplitLvFields` |
| 29줄 | `infra/ocr/NaverOcrApiClient.java:207` | `parsePlacement` |
| 29줄 | `infra/ocr/NaverOcrApiClient.java:257` | `parsePlayTime` |
| 28줄 | `infra/ocr/NaverOcrApiClient.java:420` | `normalizeOcrText` |
| 21줄 | `config/StompLoggingInterceptor.java:19` | `preSend` |
| 21줄 | `common/storage/S3FileStorageService.java:27` | 생성자 |

> 12건 중 8건이 `NaverOcrApiClient.java` 한 파일에 집중.

#### 2. 클래스 길이 > 200줄 (1건)

| 라인 수 | 파일 |
|:------:|------|
| 458줄 | `infra/ocr/NaverOcrApiClient.java` |

#### 3. `return null` (3건)

| 파일:라인 |
|---------|
| `infra/ocr/NaverOcrApiClient.java:41` |
| `common/security/JwtAuthenticationFilter.java:56` |
| `domain/session/service/SessionParticipantRegistry.java:25` |

#### 6. 3단계 이상 메서드 체인 (3건)

| 파일:라인 | 체인 |
|---------|------|
| `common/exception/GlobalExceptionHandler.java:27` | `.getBindingResult().getFieldErrors().stream()` |
| `domain/session/service/SessionService.java:128` | `.getRuleSet().getSession().getId()` |
| `global/config/LoggingAspect.java:16` | `.getTarget().getClass().getSimpleName()` |

#### 7. 매직 스트링/숫자 (12건)

**매직 스트링 (5건)**

| 파일:라인 | 값 |
|---------|---|
| `domain/team/service/TeamConfigureService.java:164` | `"READY"` |
| `domain/team/service/TeamConfigureService.java:165` | `"PARTIAL"` |
| `domain/team/service/TeamConfigureService.java:166` | `"EMPTY"` |
| `domain/team/service/TeamService.java:79` | `"LEADER"` |
| `domain/session/service/SessionBroadcaster.java:45` | `"DRAW"` |

> `"READY"/"PARTIAL"/"EMPTY"` 3종은 enum 격상 필요 (컨벤션 문서 명시).

**매직 숫자 (7건)**

| 파일:라인 | 값 | 맥락 |
|---------|:---:|------|
| `infra/ocr/NaverOcrApiClient.java:76` | `200` | HTTP 응답 코드 |
| `infra/ocr/NaverOcrApiClient.java:156` | `4` | OCR 슬롯 수 |
| `infra/ocr/NaverOcrApiClient.java:176` | `4` | 루프 반복 수 |
| `infra/ocr/NaverOcrApiClient.java:226` | `30` | Y축 픽셀 오차 범위 |
| `infra/ocr/NaverOcrApiClient.java:228` | `200` | X축 픽셀 거리 |
| `infra/ocr/NaverOcrApiClient.java:274` | `20` | Y축 픽셀 오차 범위 |
| `domain/session/service/SessionEndService.java:70` | `1` | 단독 1위 판정 |

#### 8. import 스타일 위반 — Outer.Inner 직접 참조 (5건)

| 파일:라인 | 위반 패턴 |
|---------|---------|
| `domain/session/repository/SessionRepository.java:19,25,27` | `Session.SessionStatus` (import 없음) |
| `domain/session/service/SessionTimerService.java:34` | `Session.SessionStatus.IN_PROGRESS` |
| `domain/team/service/TeamConfigureBroadcaster.java:18` | `SessionMessage.Type.PARTICIPANT_UPDATED` |
| `domain/team/service/TeamService.java:75~76` | `TeamResponse.MemberResponse` |

---

### 우선순위

| 순위 | 대상 | 이유 |
|:---:|------|------|
| 🔴 1 | `NaverOcrApiClient.java` 리팩토링 | 458줄 · 메서드 위반 8건 · 매직 숫자 6건 → 단일 파일이 전체 위반의 절반 |
| 🟡 2 | 팀 상태 enum 격상 (`"READY"/"PARTIAL"/"EMPTY"`) | 컨벤션 문서에서 직접 지목, 여러 서비스에서 참조 |
| 🟢 3 | `Session.SessionStatus` import 추가 | import 한 줄로 해결 가능 |

---

## 2. PR 변경 이력

### #현재 PR — 팀 구성 API 및 도메인 모델 개편

#### Breaking Changes

**`TeamMember` → `TeamPlayer` 엔티티 개편**
- 기존: `TeamMember`가 `User` FK + 팀원 + 업로더를 하나의 엔티티로 표현
- 변경:
  - `TeamPlayer` — PUBG 닉네임만 가지는 순수 플레이어 슬롯 (`User` FK 없음)
  - `Team.operator` — 업로드 담당자를 `@ManyToOne User`로 별도 관리
- 영향 범위:
  - `MatchResult.teamMember` → `MatchResult.teamPlayer` (컬럼명 `team_player_id`)
  - `SessionRepository` JPQL — `TeamMember` 참조 제거, `SessionUser` 기반으로 변경
  - 테스트: `TestFixtures.member()` / `uploader()` → `player(Team, String)` 대체

#### New Features

**`SessionUser` 엔티티 추가 (대기석)**
- 로그인 유저 세션 입장 시 대기석 등록 → Operator 배정 전까지 대기
- `SessionUserService`: `join()`, `leave()`, `getActiveUsers()`
- API: `POST /api/sessions/{sessionId}/join`, `DELETE /api/sessions/{sessionId}/leave`

**팀 구성 API**
- `POST /{teamId}/players` — 플레이어 추가 (Host 전용)
- `PATCH /{teamId}/players/{playerId}` — 플레이어 닉네임 수정
- `DELETE /{teamId}/players/{playerId}` — 플레이어 제거
- `PUT /{teamId}/operator` — 대기석 유저를 팀 Operator로 배정

**WebSocket 브로드캐스트**
- 팀 구성 변경 시 `/topic/sessions/{sessionId}/configure` 로 현재 상태 전파

#### 테스트 컨벤션 정비
- `.claude/skills/test-conventions/` 추가 — 팀 전체 테스트 작성 기준 정립
- 메서드명 한국어, `TestFixtures` 통일, stub 최소화 등
- 기존 테스트 파일 전반 컨벤션 동기화

#### 기타
- `ConfigureBroadcaster` → `TeamConfigureBroadcaster` 이름 변경
- `TeamRepository` 파생 쿼리 `Operator_Id` 명시적 경로 표기 통일
