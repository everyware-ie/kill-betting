# 매치 히스토리 v2 (팀별 분리 + 삭제/재업로드)

- FRD: ../../specs/frd/match-history-v2.md
- 참조 시점: 2026-08-03 / 허브 커밋 `836284a` / status: **review**
  (README 규칙 #2 "approved만 착수" 예외 — FRD가 "신규 개발 항목, 구현 후 approved 전환" 명시, 담당자 본인(JiEung2) 진행)
- 구현 상태: 완료 (#130, #131, #132 — 브랜치 `jieung/feature/match-history-team-split`)
- 관련: [match-confirm.md](../../specs/frd/match-confirm.md)(상위, approved — 점수 누적/룰 적용 로직의 원본 근거)

## 구현 노트

- **#130 표시 분리**: `MatchSummaryResponse`에 top-level `teamId`/`teamName` 추가. 프론트 `frontend/features/room/helpers/matchGrouping.js`(순수 함수) + `components/TeamMatchHistory.js`로 `live/page.js` 매치 히스토리 블록 교체.
- **#131 삭제+역산**: `MatchStatus.DELETED`(논리 삭제, matchNumber는 `countBySessionId`가 그대로 세므로 자동 보존). `Team.subtractKills/subtractRuleScore`, `TeamPlayer.subtractKills` 신규. `Match.delete(matchResults)`가 `confirm()`과 대칭으로 스냅샷 값을 역산. `MatchDeleteService`는 confirm의 느슨한 "세션 아무 리더" 검증과 분리해 `team.isLedBy(requesterId)`로 엄격 검증. `DELETE /api/matches/{matchId}` + `MatchDeletedEvent` → 기존과 동일한 `SCORE_UPDATED` 브로드캐스트 채널 재사용.
- **#132 삭제 이력**: `MatchDeletionLog`(matchId/teamId/deletedByUserId/revertedKills/revertedRuleScore, plain Long 컬럼 — HiddenSession처럼 엔티티 연관관계로 하지 않고 감사 로그 성격상 단순 ID 저장으로 결정) + `V6__create_match_deletion_logs.sql`. `MatchDeleteService.delete()`의 같은 트랜잭션 안에서 저장(별도 이벤트 리스너로 분리하지 않아 롤백 시 자동으로 함께 롤백 — 별도 롤백 테스트는 프레임워크 보장이라 생략).

## 어긋남 기록

- FRD H1은 "`MatchSummaryResponse`에 teamId 없음"만 지적했는데, 실제로 프론트 `room-api.js`의 기존 주석은 top-level teamId가 있다고 잘못 서술하고 있었음(백엔드엔 없었음) — 이번 DTO 변경으로 프론트 주석과 실제 응답이 처음으로 일치하게 됨.
- FRD 미결 2건(ENDED 삭제 허용 여부, 이력 저장 여부)은 PRD 작성 시점에 담당자가 확정(본문 "경위 메모" 참고) — 허브 FRD §7에도 반영 필요(아직 미반영, 후속 조치).

## 경위 메모

`/feature-start`에서는 "팀별 목록 분리 표시"만 프론트 전용 변경으로 좁게 논의했으나, 허브에 이미 이 주제를 다루는 FRD(`match-history-v2`, 담당자 본인)가 존재하며 범위가 **표시 분리 + 팀 리더의 매치 삭제→재업로드 + 점수 역산**까지 포함함을 확인. CLAUDE.md 규칙("허브가 상류")에 따라 이번 PRD는 허브 FRD 전체 범위로 확장한다. FRD의 미결 사항 2건은 이번 PRD 작성 중 담당자 본인이 확정했다:
- 세션 ENDED 이후 삭제 허용 여부 → **비허용**(IN_PROGRESS만, FRD 권장안)
- 삭제 이력 저장 여부 → **저장**(신규 이력 테이블, FRD 권장안 — score-adjustment의 "이력 미저장" 기술부채 반복 방지)

---

## 문제 정의

- 매치 히스토리가 팀 구분 없이 하나의 통합 목록으로 나와, 팀이 3개 이상일 때 어느 팀의 매치인지 한눈에 알기 어렵다.
- OCR 결과를 잘못 확인하고 확정(confirm)한 경우, 이를 고칠 방법이 없다 — 삭제 기능이 아예 없다.

## 해결책

- 라이브 화면(및 결과 화면)의 매치 히스토리를 **팀별 섹션**으로 분리해서 보여준다.
- 팀 리더가 **본인 팀의 확정된 매치**를 삭제할 수 있게 하고, 삭제 시 그 매치가 팀 점수(누적 킬 수, 룰 점수)에 반영한 값을 정확히 역산해 되돌린다.
- 삭제 후에는 기존 업로드→확정 플로우로 재등록한다.

## 사용자 스토리

1. 참가자로서, 매치 히스토리에서 각 매치가 어느 팀의 것인지 팀별 섹션으로 구분되어 보이길 원한다, 팀이 여러 개일 때도 특정 팀의 매치 흐름을 빠르게 확인하기 위해서다.
2. 참가자로서, 팀 섹션이 팀 생성 순서(A팀→B팀→C팀)로 항상 동일하게 나열되길 원한다, 매치가 계속 추가돼도 화면 배치가 흔들리지 않길 원해서다.
3. 참가자로서, 아직 매치를 등록하지 않은 팀도 섹션 자체는 보이고 "아직 등록된 매치 없음" 문구가 나오길 원한다, 목록에서 빠진 것인지 아직 매치가 없는 것인지 헷갈리지 않기 위해서다.
4. 참가자로서, SCORE_UPDATED 웹소켓 알림을 받으면 새로고침 없이 해당 팀 섹션에 새 매치가 바로 반영되길 원한다.
5. 참가자로서, 각 팀 섹션 안에서는 매치가 매치 번호(등록 순서) 기준으로 정렬되어 보이길 원한다.
6. 팀 리더로서, 본인 팀이 확정한 매치 옆에 삭제 버튼이 보이길 원한다, 잘못 입력한 결과를 고칠 수단이 필요해서다.
7. 팀 리더로서, 다른 팀 매치에는 삭제 버튼이 보이지 않고, 설령 API를 직접 호출해 삭제를 시도해도 서버가 거부하길 원한다, 남의 팀 기록을 실수로도 건드릴 수 없어야 해서다.
8. 팀 리더로서, 매치를 삭제하면 그 매치가 팀 누적 킬 수와 룰 점수(치킨 보너스/서바이벌 패널티)에 반영한 값이 정확히 되돌려지길 원한다, 삭제 후에도 스코어보드가 정확해야 해서다.
9. 팀 리더로서, 삭제 후 같은 업로드→확정 플로우로 매치를 다시 등록할 수 있길 원한다, 잘못 올린 기록을 정정할 수 있어야 해서다.
10. 팀 리더로서, 삭제된 매치의 번호(matchNumber)는 재사용되지 않고 다음 매치는 새 번호를 받길 원한다, 이력 추적이 끊기지 않아야 해서다.
11. 팀 리더로서, 세션이 이미 종료(ENDED)된 뒤에는 매치 삭제 시도가 거부되길 원한다, 종료 후 승자 재계산 같은 복잡한 상황을 이번 버전에서는 피하기 위해서다.
12. 팀 리더로서, 확정되지 않은(PENDING) 매치는 이 삭제 기능의 대상이 아니길 원한다 — 확정 전이라면 기존 확인/재제출 흐름으로 처리되기 때문이다.
13. 운영자/개발자로서, 누가 언제 어떤 매치를 삭제했고 점수가 얼마나 되돌려졌는지 이력이 남아 나중에 확인(감사)할 수 있길 원한다, 점수 보정 기능에서 이력이 없어 겪은 것과 같은 문제를 반복하지 않기 위해서다.
14. 참가자로서, 존재하지 않는 매치를 삭제 시도하면 404를, 리더가 아닌 사용자나 다른 팀 리더가 시도하면 403을 받길 원한다.
15. 개발자로서, 팀별 매치 그룹화 로직이 순수 함수로 분리되어 단위 테스트로 검증되길 원한다, 그룹화 규칙(정렬 기준, 빈 팀 처리)이 회귀 없이 유지되는지 확인하기 위해서다.

## 구현 결정사항

### 표시 분리 (프론트엔드)

- 백엔드 `MatchSummaryResponse`에 최상위 `teamId`, `teamName` 필드를 추가한다(현재는 `memberResults[].teamId`에만 있어 매치 단위 팀 식별이 우회적임 — FRD H1). `Match.getTeam()`에서 위임.
- 신규 프론트 도메인 폴더 `frontend/features/room/`:
  - `helpers/matchGrouping.js` — 순수 함수 `groupMatchesByTeam(matches, teams)`. `teams` 배열 순서(= 팀 생성 순서, `RoomAPI.getTeams` 응답 순서)를 그룹 순서로 사용. 매치가 없는 팀도 `{ teamId, teamName, matches: [] }`로 포함. 각 그룹 내부는 원본 매치 순서(매치 번호 오름차순, 서버가 이미 정렬) 유지.
  - `components/TeamMatchHistory.js` — 팀별 섹션 렌더링. 각 매치 항목에 삭제 버튼은 **로그인한 사용자가 그 팀의 리더일 때만** 노출.
- `live/page.js`의 매치 히스토리 렌더링 블록(현재 1029~1089줄)을 `TeamMatchHistory`로 교체.
- 기존 `frontend/lib/room-api.js`의 매치 응답 주석("각 match에 top-level teamId 있음")이 실제 백엔드 응답과 불일치했던 부분은 이번 DTO 변경으로 해소된다.

### 삭제 + 점수 역산 (백엔드)

- 신규 엔드포인트: `DELETE /api/matches/{matchId}` (`MatchController`, 기존 리소스 기준과 일치).
- 신규 서비스 흐름(`MatchDeleteService` 또는 기존 `MatchConfirmService`와 나란히 배치):
  1. 매치 조회 — 없으면 404.
  2. 매치 상태가 `CONFIRMED`가 아니면(PENDING/이미 삭제됨) 400.
  3. **요청자가 그 매치가 속한 팀의 리더인지** 검증 — 403. (주의: 기존 `MatchConfirmService.validateLeaderPermission`은 "세션 내 아무 팀의 리더인지"만 확인하는 느슨한 검증(match-confirm.md C1의 알려진 갭)이라 그대로 재사용하지 않고, 삭제는 FRD H2대로 "그 매치 소속 팀의 리더"만 허용하는 별도 검증을 사용한다. confirm의 기존 갭 자체를 고치는 것은 이번 PRD 범위 아님.)
  4. 세션 상태가 `IN_PROGRESS`가 아니면(`ENDED`) 400 — v1 정책.
  5. 점수 역산: `Match.matchKillCount`, `Match.matchBonusScore`/`matchPenaltyScore`에 이미 스냅샷된 값을 이용해 `Team`(및 개별 `TeamPlayer`)의 누적값에서 정확히 차감한다. `Team`에 감산 메서드(`subtractKills`, `subtractRuleScore` 등, `addKills`/`addRuleScore`의 역방향)를 신규 추가한다.
  6. 매치는 물리 삭제하지 않고 논리 삭제(`MatchStatus.DELETED` 신규 값 또는 별도 삭제 플래그)로 상태 변경 — 레코드를 보존해 `matchNumber` 이력이 끊기지 않게 한다(H4). 매치 히스토리 조회는 `DELETED` 상태를 제외한다.
  7. 삭제 이력 저장: 신규 엔티티(예: `MatchDeletionLog`) — `matchId`, `teamId`, `deletedByUserId`, `deletedAt`, 되돌린 킬 수/룰 점수. 신규 테이블(Flyway 마이그레이션 추가).
  8. 삭제도 팀 점수를 변경시키므로, confirm과 동일하게 이벤트를 발행해 `SessionBroadcaster`가 `SCORE_UPDATED`로 실시간 브로드캐스트한다(다른 참가자 화면도 즉시 갱신).
- 다음 매치 번호 발급 로직이 삭제 여부와 무관하게 항상 증가하는지(현재 로직이 count 기반이면 삭제된 매치를 세지 않도록) 구현 시 재확인.
- ErrorCode 신규: 매치를 찾을 수 없음(기존 것 재사용 가능성 확인), 삭제 권한 없음(403), 삭제 불가 상태(400, PENDING/이미 삭제/세션 ENDED).

### 프론트 삭제 흐름

- `RoomAPI`에 `deleteMatch(matchId)` 추가(`USE_MOCK` 분기 포함).
- 삭제 버튼 클릭 시 확인(confirm) 후 API 호출 → 성공 시 매치 히스토리 재조회. 스코어보드 갱신은 백엔드가 발행하는 `SCORE_UPDATED` 브로드캐스트로 처리(기존 패턴과 동일).

## 테스트 결정사항

- 좋은 테스트란 구현 세부사항(엔티티 필드명, SQL, 논리 삭제 플래그 이름)이 아니라 **외부에서 관찰 가능한 동작**을 검증하는 것이다: 삭제 후 팀 점수가 정확히 되돌아가는지, 다른 팀 리더는 403을 받는지, 존재하지 않는 매치는 404인지, ENDED 세션에서는 거부되는지, 삭제 후 재업로드 시 matchNumber가 재사용되지 않는지.
- 백엔드 단위 테스트: `MatchDeleteServiceTest`(Mockito) — 권한 검증, 세션 상태 가드, 점수 역산 값. `Match`/`Team` 도메인 메서드(`subtractKills`/`subtractRuleScore`) 단위 테스트는 `MatchTest`/`TeamTest`에서 `MatchFixture`/`TeamFixture` 활용.
- 백엔드 슬라이스 테스트: `MatchController`에 `@WebMvcTest`로 403/404/400 케이스.
- 프론트 유닛 테스트: `frontend/features/room/helpers/matchGrouping.test.js`(Vitest) — 팀별 정확히 분리되는지, 팀 생성 순서가 유지되는지, 매치 없는 팀도 빈 배열로 포함되는지, 팀 내부 매치 순서가 원본 그대로인지.
- 테스트 선례: `docs/backend/tests.md`의 Given/When/Then + 한국어 `DisplayName` 패턴, `docs/frontend/tests.md`의 `scoreHelpers.test.js` 응집형 배치 패턴.

## 범위 외

- 팀 개수 상한 추가 — 현재 무제한 유지, 이번 PRD와 무관한 별도 논의 대상.
- 세션 ENDED 상태에서의 매치 삭제 허용 — v1은 IN_PROGRESS만, 필요 시 후속 PRD.
- `match-confirm.md` C1의 기존 느슨함(세션 내 아무 팀 리더나 아무 매치나 confirm 가능) 자체를 고치는 것 — 기존 approved FRD의 별도 개선 후보이며, 이번 PRD는 신규 삭제 기능에서만 엄격한 검증을 적용한다.
- Admin 대시보드(admin-session-drilldown)의 매치 조회 화면 변경.
- 매치 카드 UI의 표시 내용(킬 수/순위 등) 자체 변경 — 배치 구조(팀별 섹션)만 바뀐다.
- 삭제된 매치의 복구 API — 논리 삭제라 데이터는 보존되나 복구 UI/API는 이번 범위 아님.
- `TeamPlayer.bonusKills`/`penaltyKills`(현재 갱신 코드가 없는 죽은 필드) 정리 — 발견된 별도 기술부채, 이번 PRD와 무관.

## 추가 참고사항

- FRD 미결 2건은 이번 PRD에서 확정했으므로, 허브 FRD(`match-history-v2.md` §7)에도 반영이 필요하다 — 담당자가 허브 개정 예정.
- `score-adjustment.md`에 이미 기록된 "이력 미저장" 기술부채와 같은 함정을 피하기 위해, 이번 삭제 기능은 처음부터 이력 테이블(`MatchDeletionLog`)을 둔다.
- `frontend/lib/room-api.js`의 매치 응답 주석이 실제 백엔드 응답 shape과 어긋나 있던 것을 발견 — 이번 DTO 변경(top-level teamId/teamName 추가)으로 해소.
- 충돌 위험: `Match.java`, `Team.java`가 점수 로직의 핵심 파일이라 다른 팀원이 동시에 룰/점수 관련 작업을 하고 있는지 착수 전 재확인 권장(현재 확인된 활성 브랜치 중 충돌 없음).