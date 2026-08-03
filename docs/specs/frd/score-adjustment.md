---
title: 점수 보정 FRD
product: kill-betting
type: frd
status: approved
updated: 2026-07-15
related: [kill-betting-core, session, match-confirm]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 점수 보정 — 기능정의서 (FRD)

> 상위 PRD: [kill-betting-core](../prd/kill-betting-core.md) (`approved`). 코드 기준(2026-07-15 검증).

## 1. 개요

매치 확정 후 발견된 오류나 특수 상황(규정 위반 등)에 대해 Host가 팀 점수를 직접 가감할 수 있는 기능. 사유 입력을 강제해 임의 조정을 방지한다.

## 2. 사용자 플로우

1. Host가 진행 화면의 운영 메뉴 → 점수 조정 진입
2. 대상 팀 선택, 가감 수치(+/-) 입력, 조정 사유 입력(필수)
3. 제출 → 팀의 adjustmentScore에 즉시 반영, 스코어보드의 팀 유효 점수가 갱신됨

## 3. 화면/인터랙션 정의

| 화면 ID | 이름 | 주요 구성 |
|---|---|---|
| room/[id]/live (운영메뉴 → 점수조정 모달) | 점수 조정 | 대상 팀 선택, +/- 수치 입력, 사유 입력, 저장 |

## 4. 기능 규칙 (Business Rules)

| # | 규칙 | 근거 |
|---|---|---|
| A1 | **Host만** 조정 가능 | `TeamAdjustmentService.applyAdjustment` |
| A2 | 세션이 **진행 중(`IN_PROGRESS`)** 일 때만 조정 가능 — `WAITING`/`ENDED` 상태에서는 불가 | 동일 |
| A3 | 조정 사유(reason)는 **필수 입력**(공백 불가) | `AdjustmentRequest` `@NotBlank` |
| A4 | 조정 수치(amount)는 양수·음수 모두 가능, 상한·하한 없음 | `AdjustmentRequest` |
| A5 | 조정값은 팀의 `adjustmentScore`에 누적. 팀 최종 유효 점수 = totalKills + ruleScore + adjustmentScore | `Team.applyAdjustment` / `getEffectiveKills` |

## 5. 예외 처리

| 상황 | 처리 |
|---|---|
| Host 아닌 사용자 조정 시도 | 403 |
| 진행 중 아닌 세션에서 조정 시도 | 400 |
| 존재하지 않는 팀 | 404 |
| 사유 미입력 | 400 (validation) |

## 6. 데이터

- `Team.adjustmentScore` (누적 정수). 이력은 별도로 저장되지 않는다 — §7 참고.

## 7. 비기능 요구 / 알려진 구현 갭 ⚠️

노션 FDD의 정책은 "조정 이력 저장·공개"였으나, **현재 코드는 이력을 영속 저장하지 않는다.**

- `AdjustmentAppliedEvent`가 발행되지만 구독하는 리스너가 없다 — `SessionBroadcaster.broadcastAdjustmentApplied()` 메서드는 존재하나 `@EventListener`/`@TransactionalEventListener`가 붙어 있지 않아 실행되지 않는다.
- 결과적으로 `adjustmentScore` 숫자만 누적될 뿐, **"누가·언제·왜 조정했는지"는 현재 어디서도 조회할 수 없다.**
- 이는 노션-코드의 "계획 차이"가 아니라 **미완성 구현**으로 분류한다 (2026-07-15 확인, [PRD §8](../prd/kill-betting-core.md#8-노션-대조-히스토리-2026-07-14-대조--2026-07-15-해소) 7번 항목 정정).
- 개발 이슈 등록됨: [kill-betting#92](https://github.com/everyware-ie/kill-betting/issues/92) — 후보안: ① `AdjustmentHistory` 엔티티 추가해 팀/사유/수치/조정자/시각 영속 저장 ② `SessionBroadcaster`에 `@TransactionalEventListener` 배선해 실시간 브로드캐스트 활성화.

## 8. 구현 노트 링크

kill-betting `docs/product/features/score-adjustment.md` (스텁, 필요 시 생성)
