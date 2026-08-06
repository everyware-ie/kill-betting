# 팀 생존 패널티 (TEAM_SURVIVAL_PENALTY) 조건 정정

- FRD: ../../specs/frd/match-confirm.md (C6, status: approved)
- 이슈: -
- 구현 상태: 완료

## FRD 핵심 값 (착수 시 기록 — 대조 기준, 필수)

| 항목 | FRD/glossary 명시 값 (기존) | 구현 값 (수정 후) | 일치? |
|------|------------------------------|--------------------|:----:|
| TEAM_SURVIVAL_PENALTY 발동 조건 | 팀원 전원이 TOP10 실패해야 -value 1회 (1명이라도 성공하면 감점 없음) — FRD C6 2026-08-06 개정 | 팀원 전원이 TOP10 실패해야 -value 1회 (`Rule.calculateScore` `allTeamMembersFailedTop10`) | ✅ |
| SURVIVAL_PENALTY(인당)와의 관계 | 세션당 택일 | 변경 없음 | ✅ |

## 구현 노트

- 사용자(호스트) 확인 결과, 기존 "1명이라도 실패 → 감점" 로직은 의도와 반대였음. PUBG 스쿼드 특성상 "팀이 top10에 들었는지"는 "적어도 1명이 살아서 top10에 도달했는지"와 동치이므로, 올바른 조건은 "전원 실패(생존자 0명)"일 때만 감점.
- `Rule.calculateScore`에 팀 전원 실패 여부를 추가 전달, 팀원 수 대비 실패자 수 비교로 판정.
- FE 확정 모달: `penaltyMode === 'TEAM_ONCE'`일 때 팀원별 토글 대신 치킨 보너스와 동일한 단일 토글로 입력 단순화.

## 어긋남 기록

- 2026-08-06: `.claude/domain/glossary.md`·`docs/common/tech-debt.md`(2026-07-21 PR #93 기록)·FRD C6가 모두 "1명이라도 실패 → 감점"으로 기술돼 있었으나, 사용자가 실제 의도는 "전원 실패해야 감점"이라고 확정. FRD·glossary·decisions·tech-debt를 같은 PR에서 함께 갱신 완료 — [decision](../../decisions/2026-08-06-team-survival-penalty-condition-fix.md).