# 세션 삭제 (미시작 자동삭제 + 방 수동삭제)

- FRD: ../../specs/frd/session-settings-editable.md
  ⚠️ 정확한 파일명·URL은 허브에서 확인 후 확정
- 참조 시점: 2026-07-28 / 허브 커밋 `<sha 7자리 확인 필요>` / status: **review**
  (README 규칙 #2 "approved만 착수" 예외 — FRD가 "신규 개발 항목, 구현 후 approved 전환" 명시, 담당자 본인 진행)
- 구현 상태: 진행 중
- 관련: [session-auto-end.md](session-auto-end.md)(배치 공유 — 이 PRD는 그 배치에 삭제 sweep을 추가), [ADR 0002](../../architecture/adr/0002-session-expiry-polling-over-in-memory-timer.md)

---

## 문제 정의

- 만들고 시작하지 않은 대기(WAITING) 방이 계속 쌓인다.
- Host가 방을 지울 수단이 없다.

## 해결책

- 대기중 세션이 **생성 후 3시간** 동안 시작되지 않으면 자동 삭제한다(폴링 배치).
- Host가 **상태와 무관하게** 방을 직접 삭제한다.
- 삭제는 물리 삭제가 아닌 **soft delete**(논리 삭제)로, 데이터를 보존하고 복구 가능하게 한다.

## 사용자 스토리

1. System으로서, WAITING 세션이 생성 후 3시간 동안 시작되지 않으면 자동 삭제되길 원한다, 시작되지 않는 방이 누적되지 않도록 하기 위해서다.
2. 사용자로서, 자동 삭제된 대기 세션이 방코드 조회·대기 목록·내 세션에서 보이지 않길 기대한다, 삭제된 방은 존재하지 않아야 하기 때문이다.
3. Host로서, 방을 언제든(상태 무관) 삭제하고 싶다, 더 이상 필요 없는 방을 정리하기 위해서다.
4. Host로서, 삭제한 세션이 모든 사용자 조회에서 사라지길 원한다.
5. Host가 아닌 사용자로서, 방 삭제 시도가 거부(403)되길 기대한다, 방은 Host만 지울 수 있어야 하기 때문이다.
6. 운영자로서, 삭제가 물리 삭제가 아닌 논리 삭제여서 데이터가 보존·복구 가능하길 원한다, 실수/오작동 시 되돌릴 수 있어야 하기 때문이다.

## 구현 결정사항

- **`Session`(entity)**: `deletedAt` 필드 추가. `softDelete()`(deletedAt 세팅), `isDeleted()` 도메인 메서드. 삭제는 상태 무관 허용(도메인 책임).
- **soft delete 전역 필터**: `Session` 엔티티에 `@SQLRestriction("deleted_at IS NULL")` 적용. 모든 조회(사용자·Admin)에서 삭제분 자동 제외. Micrometer 카운터 기반 트렌드 지표는 영향 없음(→ ADR 0002 참고 섹션).
- **`SessionService`**: `deleteByHost(sessionId, userId)`(Host 검증 후 `softDelete`). 진행중+데이터 있는 세션도 허용 — soft delete라 복구 가능하므로 백엔드 특별 가드 없음.
- **`SessionController`**: `DELETE /api/sessions/{sessionId}`. Host·상태무관. 성공 204.
- **`SessionLifecycleScheduler.sweep()`**(session-auto-end.md에서 신설된 배치에 추가): 미시작 3h WAITING 삭제 sweep 한 단계 추가. 결정은 리포지토리 쿼리 + `softDelete` 위임.
- **`SessionRepository`**: 파생 쿼리 — 미시작 대상(`WAITING` + `createdAt < :threshold`).
- **스키마 변경**: `sessions.deleted_at`(datetime, nullable). ERD 갱신(현재 `docs/architecture/erd/` 비어 있음 — 별도 확인).
- **임계값(설정화, `application.yml`)**: 미시작 삭제 3h. 운영 데이터로 후속 튜닝.

**엣지 노트**
- room_code는 unique. soft delete된 세션이 코드를 점유하나, 6자리 랜덤 생성이라 충돌 확률 극히 낮음. `existsByRoomCode`가 `@SQLRestriction`으로 삭제분을 못 봐 이론상 재사용 충돌 가능하나 실질 영향 미미 — 문제화 시 코드 생성기에서 삭제분 포함 조회로 보완.

## 테스트 결정사항

- **좋은 테스트 = 외부 동작만 검증**. "@SQLRestriction", "deletedAt 컬럼" 같은 구현이 아니라 "삭제된 방은 조회에 안 나온다", "비-Host는 삭제 못 한다", "3시간 미시작 방은 사라진다"처럼 관찰 가능한 결과를 테스트한다.
- **인수(HTTP seam)**: 기존 `SessionAcceptanceTest`(Cucumber) 재사용 — 방 삭제 후 방코드/내세션 조회에서 부재, 비-Host 403.
- **서비스/도메인 단위**: `Session.softDelete`/`isDeleted` 상태, `SessionService.deleteByHost` 권한 검증, 미시작 삭제 대상 판정(상태·기준시각).
- **배치 슬라이스**: session-auto-end.md의 `sweep()` 슬라이스에 "미시작 3h WAITING" 시드 케이스 추가 — sweep 후 삭제(조회 부재) 검증.
- **테스트 선례**: `SessionAcceptanceTest`(인수), `MatchTest`(도메인 단위), `SessionFixture`.

## 범위 외

- **FE 2단계 삭제 확인 다이얼로그** — soft delete로 복구 가능하므로 백엔드 가드 불필요. 확인 UX는 프론트 범위.
- **hard delete / 연관 엔티티 cascade** — soft delete 채택으로 대상 아님.
- **삭제 세션 복구 API / Admin 삭제분 조회** — 데이터는 보존되나 복구/열람 UI는 이번 범위 아님. 필요 시 후속.
- **진행중 무응답 자동종료 / 제한시간 만료** — [session-auto-end.md](session-auto-end.md) 범위(같은 배치 공유).

## 추가 참고사항

- **FRD 개정 필요분**(허브): S5 임계값 **1h → 3h**; §5 예외 "IN_PROGRESS 삭제 2단계 확인" 미결 → soft delete로 백엔드 가드 불필요(FE 다이얼로그로 처리).
- **용어**: `StaleWaitingRoom`(미시작 자동삭제), `SoftDelete` — glossary.md 반영 완료.
- **의존 순서**: 이 PRD는 [session-auto-end.md](session-auto-end.md)의 `SessionLifecycleScheduler`·폴링 배치가 선행되어야 sweep 단계를 얹을 수 있다. soft delete 인프라(`deletedAt`·`@SQLRestriction`)는 이 PRD가 도입.
- **충돌 위험**: `Session.java`·`SessionService`가 hot 파일. 작업 전 main 최신화 권장.