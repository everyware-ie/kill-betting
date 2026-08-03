---
title: 세션 목록·참여 UX FRD (대기중 참여자 노출 & 목록 숨기기/네비게이션)
product: kill-betting
type: frd
status: approved
updated: 2026-07-28
related: [session, kill-betting-core]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 세션 목록·참여 UX — 기능정의서 (FRD)

> 상위: [session.md](session.md)(기존 승인 FRD), [2026-07-22 결정](../../decisions/2026-07-22-session-list-visibility.md). status: `approved`(2026-07-28 승격) — 구현 근거로 유효하다.
> 출처: [2026-07-22 회의 종합](../../meetings/2026-07-22/synthesis.md) — 사용자 인터뷰 항목 6, 7-방나가기, 7-대시보드 복귀 UX.
> **담당: JiEung2**
> **범위 변경(2026-07-28)**: L6("방 나가기")은 실제로 "내 목록에서 숨기기"로 축소되어 구현됨([kill-betting#114](https://github.com/everyware-ie/kill-betting/pull/114)) — 세션 참여 상태(Host/Leader/Participant)나 Session/Team 데이터는 건드리지 않는 개인 UI 필터. 승격 시 아래 본문을 이에 맞춰 정정.

## 1. 개요

킬내기 시작 전 대기 상태인 방에 참여자로 들어가도 대시보드 "내 세션" 목록에서 조회되지 않는다. 코드 확인 결과 `getMySessions`는 Host이거나 `SessionUser` 테이블에 있는 사람만 조회하는데, `SessionUser`는 세션이 실제로 시작될 때(`startSession()`)만 생성돼 대기중 참여자는 대상에서 빠진다. **JiEung2가 회의 중 직접 코드를 짚어둠**: "leader인 방 조회하는 건 줄 알았는데 session id만 가져와서 세션 전체에 추가가 안 되네" — 아래 진단과 함께 담당자가 그 코드부터 재확인 후 착수.

여기에 더해 방 나가기 기능과, 대기 중 방에서 대시보드로 돌아가는 내비게이션이 없다는 phs00의 의견도 같은 영역(세션 참여 상태·대시보드)으로 묶었다.

**2026-07-28 범위 결정**: "방 나가기"(참여 자체를 종료, 팀/점수 영향 가능성 있음)는 IN_PROGRESS 상태에서의 영향 범위가 불명확해 위험도가 높다고 판단, **"내 목록에서 숨기기"**(참여 상태는 그대로 두고 개인 목록에서만 안 보이게)로 의도적으로 축소해 구현했다. 대시보드 복귀 내비게이션(L7)은 이 FRD의 이슈와 무관하게 이미 이전 작업(GNB 개선, kill-betting#65)에서 로고 클릭 동작으로 충족됨.

## 2. 사용자 플로우

1. 참여자가 roomCode로 대기중인 세션에 입장 → 이 시점부터 대시보드 "내 세션" 목록에 **WAITING 상태로 즉시 노출**
2. 세션 시작·종료에 따라 목록의 상태 표시도 갱신
3. (신규) 참여자가 화면 좌측 상단 로고 등을 클릭하면 **대시보드로 복귀**
4. (신규) 참여자가 세션을 **숨기기**를 선택하면 내 목록에서만 제거된다(세션 참여 상태·팀·점수는 변경되지 않음 — §4 참고)

## 3. 화면/인터랙션 정의

| 화면 ID | 변경 사항 |
|---|---|
| dashboard | "내 세션" 목록에 WAITING 상태 세션도 포함, 상태 배지(대기중/진행중/종료) 표시 |
| dashboard (RoomCard) | "목록에서 삭제"(숨기기) 버튼 + 확인 다이얼로그 추가. 방 코드로 재입장 시 숨김 자동 해제 |
| room/[id]/setup, room/[id]/live | 좌측 상단 로고 클릭 시 대시보드로 이동하는 내비게이션 — kill-betting#65(GNB 개선)에서 이미 충족, 이 FRD의 신규 작업 아님 |

## 4. 기능 규칙 (Business Rules)

| # | 규칙 | 근거 |
|---|---|---|
| L1 | 참여자가 세션에 **입장하는 시점**부터 "내 세션" 목록에 조회돼야 한다 | [2026-07-22 결정](../../decisions/2026-07-22-session-list-visibility.md) |
| L2 | 구현 방식 후보 ①: `SessionUser` 생성 시점을 `startSession()`이 아니라 **입장(join) 시점**으로 앞당긴다 | 가장 단순하지만 `startSession()`의 기존 로직(참가자 스냅샷 저장 의미)에 영향 없는지 확인 필요 |
| L3 | 구현 방식 후보 ②: 대기중 참여는 `SessionParticipantRegistry`(기존 in-memory/redis 레지스트리)로 이미 추적되고 있으므로, `getMySessions` 조회 시 **이 레지스트리도 함께 조회**해 WAITING 세션을 포함시킨다 (SessionUser 테이블 구조는 그대로 유지) | 기존 데이터 흐름 변경이 적어 더 안전할 수 있음 — 담당자가 둘 중 선택 |
| L4 | Host는 기존처럼 항상 조회됨(변경 없음) | 기존 로직 유지 |
| L5 | **JiEung2의 코드 진단**: 현재 목록 조회 로직이 "리더인 방"을 찾는 것으로 오인되기 쉬운 구조 — session id만 가져오고 세션 엔티티 전체를 추가하지 않아 목록에 안 나타나는 것으로 추정 | 회의 중 코드 확인(스크린샷 미첨부) — 착수 시 재확인 필요, L2/L3 중 어느 쪽과 같은 근본 원인인지 교차검증 |
| L6 | **내 목록에서 숨기기(범위 축소, 2026-07-28)**: 참여자는 자신의 "내 세션" 목록에서 특정 세션을 숨길 수 있다. Host/Leader/Participant 역할·세션 상태(WAITING/IN_PROGRESS/ENDED) 무관하게 동일하게 동작하며, 세션 참여·팀·점수 데이터는 전혀 변경하지 않는 순수 개인 UI 필터다. 방 코드로 재입장하면 숨김이 자동 해제된다(역할 유지) | [kill-betting#114](https://github.com/everyware-ie/kill-betting/pull/114) — 원래 계획이던 "참여 자체 종료"는 IN_PROGRESS 영향 범위가 불명확해 위험도가 높다고 판단, 낮은 위험의 숨기기로 축소 |
| L7 | **대시보드 복귀 내비게이션**: 로고 클릭 시 대시보드 이동 — kill-betting#65(GNB 개선)에서 이미 충족. 이 FRD가 새로 구현한 것은 아니며, 관련 있어 함께 기록만 함 | phs00 추가 의견 |

## 5. 예외 처리

| 상황 | 처리 |
|---|---|
| 세션 종료 후에도 목록에 남아있어야 하는지 | 기존과 동일하게 유지(이번 변경은 WAITING 노출 추가만, 기존 종료 세션 동작은 변경 없음) |
| Host가 "숨기기"를 시도하는 경우 | 허용 — 개인 목록 UI일 뿐이라 Host 권한·세션 상태에 영향 없음 (L6 범위 축소로 미결 해소) |
| IN_PROGRESS 상태에서 숨기기 시도 | 허용 — 팀/점수/리더 배정에 영향 없음 (L6 범위 축소로 미결 해소) |

## 6. 데이터

- **실제 구현(kill-betting#112)**: L2·L3 어느 쪽도 그대로 채택하지 않고, 제3의 방식 — `SessionQueryService.getMySessions`가 기존에 이미 쓰던 `teamRepository.findSessionIdsByLeaderUserId`(리더 세션 ID 조회)를 병합해 누락된 리더 세션만 채워 넣는다. `SessionUser` 생성 시점(L2)도, `SessionParticipantRegistry` 병합(L3)도 건드리지 않았다.
  - `[확인 필요]` 이 수정은 **리더로 지정된 WAITING 세션 누락**(L5 진단)을 고친 것이 확인됐다. **리더가 아닌 일반 참여자**가 WAITING 세션에 입장했을 때도 L1대로 즉시 노출되는지는 이번 승격 과정에서 별도로 검증하지 못했다 — 회의에서 확인하거나 후속 이슈로 남기는 것을 권장
- **숨기기(L6, kill-betting#114)**: 신규 `HiddenSession` 엔티티(session, user 단위) — 숨김 처리는 멱등, 방 재입장(`GET /sessions/join/{roomCode}`) 시 자동 복원. Session/Team/SessionUser 데이터는 건드리지 않는다

## 7. 비기능 요구 / 열린 질문

- L2 vs L3 미결은 해소됨 — 실제로는 리더 세션 ID 병합(제3의 방식)으로 구현됨. §6 참고
- IN_PROGRESS "나가기" 허용 여부 미결은 해소됨 — L6이 "숨기기"로 축소되며 팀/점수 영향 자체가 없어져 무의미해짐
- `[확인 필요]` 리더가 아닌 일반 참여자의 WAITING 세션 노출(L1)이 실제로 커버되는지 — §6 참고, 후속 확인 권장

## 8. 구현 노트 링크

kill-betting `docs/product/features/session-list-visibility.md` (스텁, 구현 시 생성)
