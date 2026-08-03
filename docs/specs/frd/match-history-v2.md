---
title: 매치 히스토리 v2 FRD (팀별 분리 & 삭제)
product: kill-betting
type: frd
status: approved
updated: 2026-08-03
related: [match-confirm, kill-betting-core]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 매치 히스토리 v2 — 기능정의서 (FRD)

> 상위: [match-confirm.md](match-confirm.md)(기존 승인 FRD), [2026-07-22 결정](../../decisions/2026-07-22-match-history-v2.md). status: `approved`(2026-08-03, 구현 완료 후 전환 — kill-betting #130~#132).
> 출처: [2026-07-22 회의 종합](../../meetings/2026-07-22/synthesis.md) — 사용자 인터뷰 항목 2.
> **담당: JiEung2** (2026-07-28 회의에서 phs00 → JiEung2로 이관 — phs00은 C그룹 작업으로, JiEung2는 D그룹 완료 후 순번상 다음 착수)

## 1. 개요

현재 매치 히스토리는 팀 구분 없이 하나의 목록으로 합쳐져 있어 A팀/B팀 어느 기록인지 알 수 없다. 또한 확정된 매치를 잘못 입력했을 때 고칠 방법이 없다. 이 FRD는 ① 팀별 분리 표시 ② 팀 리더의 자기 팀 매치 삭제→재업로드를 다룬다.

## 2. 사용자 플로우

1. 사용자가 `room/[id]/live` 또는 `room/[id]/result`에서 히스토리 조회 → **팀별로 분리된 섹션**으로 표시
2. 팀 리더가 자기 팀의 확정된 매치 옆 **삭제 버튼**을 눌러 삭제
3. 삭제 시 해당 매치가 팀 점수에 반영한 만큼 **되돌림**(킬 수·룰 점수)
4. 리더가 다시 [업로드](match-upload.md)→[승인](match-confirm.md) 플로우로 재등록

## 3. 화면/인터랙션 정의

| 화면 ID | 변경 사항 |
|---|---|
| room/[id]/live, room/[id]/result | 히스토리를 팀별 섹션(A팀 히스토리 / B팀 히스토리 …)으로 분리 표시. 각 매치 항목에 삭제(X) 버튼 — 본인 팀 리더에게만 노출 |

## 4. 기능 규칙 (Business Rules)

| # | 규칙 | 근거 |
|---|---|---|
| H1 | 매치 히스토리 응답에 **팀 구분 정보(teamId, teamName)** 를 포함한다 | 현재 `MatchSummaryResponse`에 팀 필드 없음(재확인) — `Match` 엔티티엔 `team` 필드가 이미 있으므로 DTO 노출만 추가하면 됨 |
| H2 | 삭제는 **해당 매치가 속한 팀의 리더만** 가능 (다른 팀 리더·일반 참여자 불가) | [team-setup-delegation.md](team-setup-delegation.md)의 팀 단위 권한 원칙과 일관 |
| H3 | 삭제 시 그 매치가 팀 점수(`totalKills`, `ruleScore`)에 반영한 값을 **정확히 역산해 되돌린다** — 단순 레코드 삭제만으로는 팀 누적 점수가 안 맞음 | [match-confirm.md C5·C6](match-confirm.md) 계산식의 역연산 필요 |
| H4 | 삭제된 매치 번호(matchNumber)는 재사용하지 않는다(재업로드 시 새 번호 발급) — 이력 추적을 위해 | 신규 원칙, 팀 논의로 확정 |
| H5 | CONFIRMED 매치만 삭제 가능(PENDING은 애초에 confirm 전이므로 별도 처리 불필요) | `MatchStatus` 상태 모델과 일관 |

## 5. 예외 처리

| 상황 | 처리 |
|---|---|
| 팀 리더가 아닌 사용자가 삭제 시도 | 403 |
| 다른 팀 매치 삭제 시도 | 403 |
| 존재하지 않는 매치 삭제 시도 | 404 |
| 세션이 이미 ENDED인 상태에서 삭제 시도 | 400 (IN_PROGRESS 세션만 허용, §7 결정) |

## 6. 데이터

- `MatchSummaryResponse`에 `teamId`, `teamName` 필드 추가
- 매치 삭제 API 신규: `DELETE /api/matches/{matchId}` (또는 `/api/sessions/{sessionId}/matches/{matchId}`)
- 삭제 시 `Team.totalKills`/`ruleScore`에서 해당 매치 기여분 차감, `TeamPlayer.totalKills`도 동일하게 되돌림

## 7. 비기능 요구 / 결정 사항

- **결정**: 세션 ENDED 후에는 삭제를 허용하지 않는다. IN_PROGRESS 세션의 매치만 삭제 가능(첫 버전 권장안 채택 — 승자 재계산 등 범위 확장은 후속으로 미룸).
- **결정**: 삭제 이력을 남긴다. `MatchDeletionLog`(matchId, teamId, deletedByUserId, revertedKills, revertedRuleScore, deletedAt) 신규 테이블로 [보정 이력 미저장 갭](score-adjustment.md#7-비기능-요구--알려진-구현-갭-️)과 같은 문제 반복을 방지.

## 8. 구현 노트 링크

kill-betting `docs/product/features/match-history-v2.md` — 구현 완료, 상세 구현 노트 참고 (PR: kill-betting jieung/feature/match-history-team-split, 이슈 #130~#132)
