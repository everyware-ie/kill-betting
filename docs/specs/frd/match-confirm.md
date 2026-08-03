---
title: 매치 결과 승인(확정) FRD
product: kill-betting
type: frd
status: approved
updated: 2026-07-15
related: [kill-betting-core, session, match-upload]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 매치 결과 승인(확정) — 기능정의서 (FRD)

> 상위 PRD: [kill-betting-core](../prd/kill-betting-core.md) (`approved`). 코드 기준(2026-07-15 검증).

## 1. 개요

[업로드](match-upload.md)된 OCR 결과를 팀 리더가 확인·수정한 뒤 제출(confirm)하면, 그 시점에 팀원별 결과가 확정 저장되고 세션 규칙이 적용되어 팀 점수가 갱신된다. 확정 후에는 수정할 수 없고, 이후 조정이 필요하면 Host의 [점수 보정](score-adjustment.md)으로만 가능하다.

## 2. 사용자 플로우

1. 리더가 업로드 응답(OCR 결과)을 화면에서 확인, 필요 시 플레이어별 킬/데미지/어시스트/Top10 여부 및 맵/등수/치킨 여부 수정
2. "결과 확정" 제출
3. 서버: 팀 전원의 결과가 모두 포함됐는지 검증 → 매치 결과 저장 → 룰 적용(치킨 보너스/서바이벌 패널티) → 팀 점수 갱신 → 스코어보드 실시간 브로드캐스트
4. 목표 킬 수 도달 시 세션 자동 종료 ([세션 FRD](session.md) B8)

## 3. 화면/인터랙션 정의

| 화면 ID | 이름 | 주요 구성 |
|---|---|---|
| room/[id]/live (확정 모달) | OCR 결과 확인 | 플레이어별 킬/데미지/어시스트/Top10 토글, 치킨 토글, 맵/등수, 확정 버튼 |

## 4. 기능 규칙 (Business Rules)

| # | 규칙 | 근거 |
|---|---|---|
| C1 | confirm 가능 권한: **세션 내 어느 팀이든 리더로 배정된 사용자**면 가능 | `MatchConfirmService.validateLeaderPermission` — ⚠️ 매치가 속한 팀의 리더인지까지는 검증하지 않고, "이 세션에서 리더인지"만 확인한다. 실사용(친구 그룹, 소규모)에선 문제 없었으나 다중 팀 상황에서 다른 팀 리더가 남의 매치를 확정할 수 있는 느슨함이 있음 — 향후 강화 후보 |
| C2 | 팀 소속 플레이어 **전원**의 결과가 제출돼야 확정 가능 — 한 명이라도 빠지면 확정 불가 | `createAndSaveMatchResults` |
| C3 | `PENDING` 매치만 confirm 가능, 이미 `CONFIRMED`면 재확정 불가 | `Match.confirm` / `findValidMatch` |
| C4 | 킬/데미지/어시스트는 0 이상이어야 함 | `MatchResult` 검증 |
| C5 | 팀 킬 수 = 이번 매치 팀원 킬의 합 → 팀 누적킬(totalKills)에 가산. 플레이어 개인 누적킬에도 동일하게 가산 | `Match.accumulateKills` |
| C6 | **룰 적용**: `CHICKEN_BONUS` — 치킨(1등) 달성 시 팀 점수 +value. `SURVIVAL_PENALTY` — Top10 미달성 플레이어 수(failedTop10Count) × value 만큼 팀 점수 차감. 세션에 설정된 활성(enabled) 규칙만 순회 적용. ⚠️ **[kill-betting#93](https://github.com/everyware-ie/kill-betting/pull/93)(리뷰 대기, 미머지)**에서 인원수 무관 팀 1회 감점 옵션 `TEAM_SURVIVAL_PENALTY` 추가 예정 — 기존 `SURVIVAL_PENALTY`와 택일, 머지되면 이 규칙 갱신 | `Rule.calculateScore`, `Match.applyRules` |
| C7 | 확정 시 세션에 목표 킬 수(targetKills)가 설정돼 있고 해당 팀의 유효 점수(킬+룰+보정)가 그 이상이면 그 팀 승리로 세션 **자동 종료** | `MatchConfirmService.checkKillLimit` |
| C8 | 확정 후 결과 수정 불가 — 조정이 필요하면 Host의 [점수 보정](score-adjustment.md)만 사용 가능 | FDD 정책·코드 일치 확인 |

## 5. 예외 처리

| 상황 | 처리 |
|---|---|
| 팀원 결과 누락 | 400 "결과가 입력되지 않은 팀원이 있습니다" |
| 팀원 아닌 닉네임으로 제출 | 400 "OO은(는) 팀원이 아닙니다" |
| 이미 확정된 매치 재확정 시도 | 400 "이미 확정된 매치입니다" |
| 세션 내 리더 아닌 사용자 confirm 시도 | 403 |

## 6. 데이터

- **Match** (확정 시 갱신): status→`CONFIRMED`, isChicken, mapName, placement, playTime, failedTop10Count, matchKillCount, matchBonusScore, matchPenaltyScore
- **MatchResult** (신규 생성, 확정 후 불변): match, teamPlayer, kills, damage, assists, isTop10
- **이벤트**: `MatchConfirmedEvent`(팀/플레이어 스냅샷) → 실시간 브로드캐스트(`SessionBroadcaster`)

## 7. 비기능 요구 / 정책 연계

- 확정 카운터 메트릭(`match.confirmed`)
- 확정은 트랜잭션 내에서 처리되고, 브로드캐스트는 `AFTER_COMMIT` 시점에 발생 — 트랜잭션이 롤백되면 알림이 나가지 않는 것이 보장됨

## 8. 구현 노트 링크

kill-betting `docs/product/features/match-confirm.md` (스텁, 필요 시 생성)
