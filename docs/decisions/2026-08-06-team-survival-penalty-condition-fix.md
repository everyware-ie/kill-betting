---
title: 팀 생존 패널티(TEAM_SURVIVAL_PENALTY) 발동 조건 정정
product: kill-betting
type: decision
status: decided
date: 2026-08-06
related_meeting: -
tags: [kill-betting, rule, team-survival-penalty]
---

# 팀 생존 패널티(TEAM_SURVIVAL_PENALTY) 발동 조건 정정

## 배경

2026-07-21 PR #93로 `TEAM_SURVIVAL_PENALTY` 룰이 도입됐고, 당시 `.claude/domain/glossary.md`·`docs/common/tech-debt.md`에는 "TOP10 실패자가 1명이라도 있으면 팀 전체 -value 1회 감점"으로 기록·구현됐다.

담당자(호스트)가 실제 사용 중 이 동작이 의도와 반대라고 확인: 팀 단위 패널티는 "팀원 전원이 TOP10에 실패했을 때만" 적용돼야 하며, 1명이라도 TOP10에 살아남으면 감점이 없어야 한다. 기존 로직(1명이라도 실패 → 감점)은 이 의도와 정반대였다.

## 결정

- `TEAM_SURVIVAL_PENALTY` 발동 조건을 **"팀원 전원이 TOP10 실패"** 로 변경한다(기존 "1명이라도 실패"에서 반전).
- `SURVIVAL_PENALTY`(인당)와의 택일 관계는 유지한다.
- FE 확정 모달에서 `TEAM_ONCE` 모드는 치킨 보너스와 동일하게 **팀 단위 토글 1개**로 입력받는다(기존 팀원별 개별 토글 대신).

## 다음 액션

- FRD 개정: [specs/frd/match-confirm.md](../specs/frd/match-confirm.md) C6 개정 섹션(2026-08-06)
- 구현: `jieung/fix/team-survival-penalty-condition` 브랜치
- 교훈: 룰 발동 조건처럼 부호가 반전되면 완전히 다른 의미가 되는 값은, 도입 시점에 실제 사용자 시나리오(예시 매치 1~2건)로 교차 검증하는 절차가 없었다. 이후 유사 룰 추가 시 "정상 케이스 1개 + 반대 케이스 1개"를 PR 설명에 명시하는 것을 권장.
