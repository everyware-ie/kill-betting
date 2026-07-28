# ADR 0002: 세션 만료 처리 — 인메모리 타이머 → 폴링 배치 전환

- 상태: 수용(Accepted) — 만료 종료 폴링 전환은 #116에서 구현. 무응답 종료(#118)·미시작 삭제(#119)는 후속.
- 날짜: 2026-07-28
- 관련 FRD: 세션 설정 수정 & 자동종료 정책
- 담당: jminkkk

## 배경

제한시간이 설정된 세션은 시간이 만료되면 자동 종료돼야 한다. 현재 구현:

- `SessionTimerService.scheduleExpiry()`가 세션 시작 시 Spring `TaskScheduler`
  (JVM 인메모리 스레드풀)에 "만료 시각에 1회 실행" 작업을 등록한다.
- 재배포/재시작으로 인메모리 작업이 유실되면 `recoverInProgressSessions()`가
  앱 부팅 시(`ApplicationReadyEvent`) IN_PROGRESS 세션을 재조회해 재등록/즉시종료한다.

**문제**: 인메모리 스케줄은 재배포가 잦은 사이드 프로젝트 환경에 구조적으로 취약하다.
복구는 부팅 시점에만 동작하므로 다운타임 동안 만료가 지연되고, 단일 스레드
스케줄러 경합·다중 인스턴스 시 특정 인스턴스에만 타이머가 등록되는 문제가 있다.
실제로 "10분 설정 후 9시간 미종료" 사례가 보고됐다.

또한 신규 요구사항인 **무응답 자동종료(6h)** 와 **미시작 자동삭제(3h)** 는 어차피
주기적 배치를 필요로 한다.

## 결정

세션 만료 종료를 **인메모리 타이머에서 1분 주기 폴링 배치로 전환**한다.

- 신규 `SessionLifecycleScheduler`(`@Scheduled(fixedRate = 60_000)`)가 매분 실행하며
  세 가지를 한 번에 처리한다:
  1. 제한시간 만료 IN_PROGRESS 종료 (기존 인메모리 타이머 대체)
  2. 무응답 6h IN_PROGRESS 종료 (`SessionEndReason.INACTIVITY`)
  3. 미시작 3h WAITING 삭제 (soft delete)
- `SessionTimerService`, `SessionService.startSession`의 `scheduleExpiry(...)` 호출,
  `recoverInProgressSessions()`를 **제거**한다. Spring `TaskScheduler` 빈은 더 이상 참조하지 않는다.

**이유**:
- 만료 판정을 DB 상태(`startedAt + timeLimitMinutes`) 기준으로 매분 재평가하므로
  재배포·재시작·다중 인스턴스에 안전하다(부팅 복구 로직 불필요).
- 무응답 종료·미시작 삭제 배치를 어차피 만들어야 하므로, 만료 종료를 같은 배치에
  흡수하면 순증 비용이 거의 없다.
- 진행중 제한시간 편집 시 타이머 재등록(cancel/reschedule)이 불필요해진다 —
  배치가 매분 현재 `timeLimitMinutes` 값을 다시 읽는다.

**트레이드오프**: 종료 시점에 최대 1분 지연이 생긴다. 킬내기 세션 자동종료에는
무해하며(현재 9시간 지연 대비), 정밀도보다 신뢰성을 택한다.

**대안(기각)**: 인메모리 타이머 유지 + 폴링 배치 이중 안전망 — 즉시성 이득은 있으나
두 종료 경로의 중복 방지 로직이 필요하고 복잡도가 는다. 단일 폴링 경로가 단순하다.

## 결과

- `SessionLifecycleScheduler` 신규. `SessionTimerService` 삭제.
- `SessionEndReason`에 `INACTIVITY` 추가, `SessionEndService.endByInactivity` 신규.
- `Session`에 `lastMatchAt`(무응답 판정), `deletedAt`(soft delete) 필드 추가.
- 임계값(만료 폴링 주기 1분, 무응답 6h, 미시작 3h)은 `application.yml`로 설정화하고
  운영 데이터로 후속 튜닝한다.

## 참고

- soft delete 필터는 `Session` 엔티티에 `@SQLRestriction("deleted_at IS NULL")`로 전역 적용한다.
  Admin 조회에서도 삭제분이 숨겨지나, Micrometer 카운터 기반 트렌드 지표는 영향받지 않는다.