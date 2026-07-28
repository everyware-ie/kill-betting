# 세션 자동종료 (제한시간 만료 + 무응답) & 폴링 배치 전환

- FRD: https://github.com/everyware-ie/mechuri-docs/blob/main/products/kill-betting/specs/frd/session-settings-and-lifecycle.md
  ⚠️ 정확한 파일명·URL은 허브에서 확인 후 확정
- 참조 시점: 2026-07-28 / 허브 커밋 `<sha 7자리 확인 필요>` / status: **review**
  (README 규칙 #2 "approved만 착수" 예외 — FRD가 "신규 개발 항목, 구현 후 approved 전환" 명시, 담당자 본인 진행)
- 구현 상태: 진행 중
- 관련: [ADR 0002](../../architecture/adr/0002-session-expiry-polling-over-in-memory-timer.md), [session-deletion.md](session-deletion.md)(배치 공유)

---

## 문제 정의

- 제한시간이 걸린 세션이라도 방치되면 안 끝난다. 인메모리 타이머(`TaskScheduler`)가 재배포 때 유실돼 "10분 설정 후 9시간 미종료" 사례가 발생한다. 복구 로직 자체는 정상이나, 인메모리 구조가 재배포 잦은 환경에 구조적으로 취약하다.
- 제한시간이 없는 진행중 세션은 방치 시 영원히 열려 있다.

## 해결책

- 제한시간 만료 종료를 인메모리 타이머에서 **1분 주기 폴링 배치**로 전환해, 재배포·재시작에도 유실 없이 동작하게 한다.
- 진행중 세션이 **마지막 매치 확정으로부터 6시간** 동안 새 매치가 없으면 같은 배치로 자동 종료한다.

## 사용자 스토리

1. System으로서, 제한시간 만료 종료가 서버 재배포·재시작에도 유실되지 않고 만료 후 1분 이내 동작하길 원한다, 방치된 세션이 안정적으로 정리되어야 하기 때문이다.
2. Host로서, 진행중 세션이 마지막 매치 확정 후 6시간 무응답이면 자동 종료되길 원한다, 방치된 세션이 영원히 열려 있지 않도록 하기 위해서다.
3. System으로서, 무응답 종료 시 승자를 시간만료 종료와 동일한 기준으로 판정한다, 종료 사유가 달라도 결과 산정은 일관되어야 하기 때문이다.
4. System으로서, 매치가 확정될 때마다 무응답 판정 기준 시각이 갱신되길 원한다, "마지막 행동"을 정확히 반영하기 위해서다.
5. System으로서, 매치가 한 건도 없는 진행중 세션은 시작 시각 기준 6시간으로 종료한다, 시작만 하고 방치된 경우도 정리되어야 하기 때문이다.
6. Host로서, 진행중 제한시간을 편집하면 편집된 값 기준으로 만료가 판정되길 원한다, 편집이 즉시 반영되어야 하기 때문이다.

## 구현 결정사항

- **`Session`(entity)**: `lastMatchAt` 필드 추가(무응답 판정 기준). `start()`에서 시작 시각으로 초기화(매치 0건이어도 판정 기준 존재). `touchLastMatch(at)` 도메인 메서드. 만료 판정은 기존 `isExpired(now)`(= `startedAt + timeLimitMinutes < now`) 재사용, 무응답 판정 술어 추가.
- **`SessionLifecycleScheduler`(신규)**: `@Scheduled(fixedRate = 60_000)` 1분 폴링. `sweep()`이 (1) 만료 IN_PROGRESS 종료, (2) 무응답 6h IN_PROGRESS 종료 처리. 결정은 리포지토리 쿼리 + 도메인 술어 + `SessionEndService`에 위임(얇은 glue). (미시작 삭제 sweep은 [session-deletion.md](session-deletion.md)에서 이 배치에 추가.)
- **제거**: `SessionTimerService`, `SessionService.startSession`의 `scheduleExpiry(...)` 호출, `recoverInProgressSessions()`. `TaskScheduler` 빈 미참조. (→ ADR 0002)
- **`SessionEndService`**: `endByInactivity(sessionId)` 추가. 승자 판정은 `endByTimeExpiry`와 동일한 `determineWinner` 재사용. 이미 종료된 세션이면 no-op(멱등).
- **`SessionEndReason`**: `INACTIVITY` 추가(현재 KILL_LIMIT_REACHED/TIME_EXPIRED/HOST_TERMINATED). 메트릭 태그 `inactivity`.
- **`SessionRepository`**: 파생 쿼리 — 만료 대상(`IN_PROGRESS` + `timeLimitMinutes` not null), 무응답 대상(`IN_PROGRESS` + `lastMatchAt < :threshold`). 기존 `findByStatusAndTimeLimitMinutesIsNotNull`는 만료 폴링에 활용/정리.
- **`MatchConfirmService.confirm`**: 확정 처리 끝에 `session.touchLastMatch(now)` 호출로 무응답 기준 갱신.
- **스키마 변경**: `sessions.last_match_at`(datetime, nullable). ERD 갱신(현재 `docs/architecture/erd/` 비어 있음 — 별도 확인).
- **임계값(설정화, `application.yml`)**: 폴링 주기 60s, 무응답 종료 6h. 운영 데이터로 후속 튜닝.

## 테스트 결정사항

- **좋은 테스트 = 외부 동작만 검증**. "1분 폴링", "TaskScheduler 제거" 같은 구현이 아니라 "6시간 무응답이면 종료된다", "만료 시각이 지나면 종료된다"처럼 관찰 가능한 결과를 테스트한다.
- **도메인 단위**: `Session.isExpired(now)`, 신규 무응답 판정 술어 — 시간 의존은 `now`를 파라미터로 고정값 주입(현 방식 踏襲). Mock 불필요.
- **서비스 단위**: `SessionEndService.endByInactivity` — 승자 판정, 이미 종료 시 no-op.
- **배치 슬라이스(신규, 유일한 새 seam)**: `SessionLifecycleScheduler.sweep()`을 시드 데이터(만료 세션 / 무응답 세션 / 정상 세션)에 대해 호출 후 상태 검증.
- **테스트 선례**: `MatchTest`(도메인 단위), `SessionAcceptanceTest`(인수), `SessionFixture`.

## 범위 외

- **미시작 자동삭제 / 방 수동삭제** — [session-deletion.md](session-deletion.md) 범위(같은 배치·soft delete 공유).
- **다중 인스턴스 배치 중복 실행 방지**(리더 선출/분산 락) — 종료가 멱등(이미 종료면 no-op)이라 현 규모에선 불필요. 규모 확장 시 재검토.
- **9시간 지연 원인 로그 확정** — 구조 전환으로 근본 해결되므로 원인 규명은 선택. 필요 시 배포 이력·인스턴스 수 확인.

## 추가 참고사항

- **FRD 개정 필요분**(허브): S3 "타이머 검증" → **"폴링 전환"**(복구 로직 자체는 정상이었음).
- **용어**: `InactivityTimeout`(무응답 자동종료) — glossary.md 반영 완료. 자동종료(→ENDED)와 자동삭제(→SoftDelete)는 다른 개념.
- **충돌 위험**: `Session.java`·`SessionService`·`MatchConfirmService`가 hot 파일. 작업 전 main 최신화 권장.