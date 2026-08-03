---
title: 세션 설정 수정 & 자동종료/자동삭제 정책 도입
product: kill-betting
type: decision
status: decided
date: 2026-07-22
related_meeting: products/kill-betting/meetings/2026-07-22/synthesis.md
tags: [kill-betting, session, bugfix]
revised_date: 2026-07-28
---

# 세션 설정 수정 & 자동종료/자동삭제 정책 도입

## 배경

관련 회의: [2026-07-22 회의 종합](../meetings/2026-07-22/synthesis.md)

인터뷰에서 확인된 문제: ① 방 생성 후 설정(목표킬/제한시간)을 바꿔도 반영이 안 되는 것처럼 보임(재테스트에서는 되는 것처럼 보이기도 해 재현 조건 확인 필요) ② 제한시간을 걸어도 세션이 자동 종료되지 않는 경우 발생(코드 확인 결과 인메모리 타이머 구조의 구조적 취약점으로 추정, 정확한 실패 원인은 로그 확인 필요) ③ 세션이 방치되는 경우에 대한 자동 종료·삭제 정책 자체가 없음.

## 결정

- **세션 설정(목표킬·제한시간) 수정 기능을 추가**한다 — WAITING 상태에서만, Host만 가능
- **제한시간 자동종료의 신뢰성을 개선**한다 — 로그로 원인 파악 후 필요 시 인메모리 스케줄을 더 견고한 방식(DB 폴링 등)으로 보완
- **진행중 세션 무응답 자동종료**: 세션 시작 후 **마지막 매치 등록 시점 기준 6시간** 동안 새 매치 등록이 없으면 자동 종료. "마지막 행동"은 매치 등록으로만 정의(범위 확대 우려로 명시적 제한)
- **대기중 세션 자동삭제(신규)**: 방 생성 후 **1시간** 동안 세션이 시작되지 않으면 자동 삭제. 임계값 근거는 정상 시작된 세션의 생성→시작 소요시간 분포(평균·중앙값·p90)로 확보(쿼리는 FRD §7 참고)
- **방 삭제 기능(수동)**: Host가 직접 방을 삭제할 수 있는 기능도 함께 추가(자동삭제와 별개로, phs00 추가 의견)

## 다음 액션

- FRD 상세: [specs/frd/session-settings-editable.md](../specs/frd/session-settings-editable.md)
- 담당: **jminkkk**
- 착수 전: 제한시간 미작동 서버 로그 확인, 1시간 임계값 근거용 SQL 실행

## 개정 (2026-07-28)

대기중 세션 자동삭제 임계값을 **1시간 → 3시간**으로 변경한다. 채널 밖(카톡) 논의로 재조정됐고, 이미 그 값(3시간)으로 구현·머지됐다([kill-betting#123](https://github.com/everyware-ie/kill-betting/pull/123), 이슈 [#119](https://github.com/everyware-ie/kill-betting/issues/119)).

- 원래 계획: 1시간, SQL로 생성→시작 소요시간 분포 검증 후 확정 예정이었음
- 실제: 검증 SQL을 돌리지 않은 채 3시간으로 논의·구현됨 — 이번 승격을 계기로 결정 문서에 사후 반영
- FRD도 3시간으로 함께 정정: [specs/frd/session-settings-editable.md](../specs/frd/session-settings-editable.md) S5
- 교훈: 채널 밖 논의로 스펙과 다른 값이 확정되면 문서에 반영되지 않고 넘어갈 수 있다 — 2026-07-28 회의에서 재발 방지 워크플로우 논의 대상으로 등록([ops/governance-gaps-2026-07-28.md](../ops/governance-gaps-2026-07-28.md))

## 개정 (2026-07-28) #2: S1 편집 허용 범위

원래 결정("목표킬·제한시간 수정은 WAITING 상태에서만")과 달리, 실제 구현([kill-betting#124](https://github.com/everyware-ie/kill-betting/pull/124))은 **WAITING·IN_PROGRESS 둘 다** 수정을 허용한다(진행중 세션 수정 시 이전 확정 매치 점수는 불변).

2026-07-28 회의에서 이 구현이 맞는 방향이라고 확정했다 — 원래 결정을 이 방향으로 개정한다.

- 원래 계획: WAITING 한정
- 실제/확정: WAITING + IN_PROGRESS 모두 허용, ENDED만 불가
- FRD도 함께 정정: [specs/frd/session-settings-editable.md](../specs/frd/session-settings-editable.md) S1
- 위 개정(#1, 임계값 1h→3h)과 같은 패턴 — 채널 밖 논의가 먼저 있었고 문서가 뒤늦게 따라간 사례
