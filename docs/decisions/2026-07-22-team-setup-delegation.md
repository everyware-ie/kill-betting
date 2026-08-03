---
title: 팀 구성 권한 위임 & 닉네임 즐겨찾기
product: kill-betting
type: decision
status: decided
date: 2026-07-22
related_meeting: products/kill-betting/meetings/2026-07-22/synthesis.md
tags: [kill-betting, team-setup]
---

# 팀 구성 권한 위임 & 닉네임 즐겨찾기

## 배경

관련 회의: [2026-07-22 회의 종합](../meetings/2026-07-22/synthesis.md)

인터뷰에서: 팀 구분·닉네임 기입을 방장만 할 수 있어 방장이 계속 다 처리해야 해서 힘듦. 코드 확인 결과 `TeamConfigureService`가 모든 팀 구성 동작(팀 생성/플레이어 추가·수정·삭제/리더 지정)에 Host 검증을 걸어둠([session FRD B3](../specs/frd/session.md), 2026-07-15 확정 사항). 추가로 매번 같은 멤버 닉네임을 타이핑하는 게 귀찮다는 즐겨찾기 요청.

## 결정

- **팀 리더는 본인이 리더인 팀에 한해 팀원(닉네임) 추가·수정·삭제가 가능**하도록 권한을 위임한다. Host는 기존처럼 전체 팀에 대해 가능(상위 권한 유지). 팀 생성·리더 지정 자체는 Host 전용으로 유지(팀 구조 자체를 바꾸는 것은 더 신중해야 함)
- **닉네임 즐겨찾기 기능을 신규 도입**한다 — 자주 쓰는 팀원 닉네임을 저장해두고 한 번의 선택으로 팀에 추가

## 다음 액션

- FRD 상세: [specs/frd/team-setup-delegation.md](../specs/frd/team-setup-delegation.md)
- 담당: **phs00**
- [session.md B3](../specs/frd/session.md#4-기능-규칙-business-rules)는 이 결정으로 개정됨 — 해당 문서에 개정 표시 추가

## 개정 (2026-07-28)

닉네임 즐겨찾기 UI 작업(kill-betting#110) 중 발견: 화면단은 이미 다른 팀에 쓰인 닉네임을 걸러내도록 고쳤지만, 백엔드 검증(T4)은 여전히 **팀 단위**로만 중복을 막아 직접 타이핑하면 같은 세션의 다른 팀에 같은 닉네임을 등록할 수 있었다.

2026-07-28 회의 결정: 닉네임 고유 범위를 **팀 내 → 세션 내**로 확대한다(유효성 검증 필요, 백엔드 반영 예정).

- 원래: 팀 내 고유(session.md B5 그대로 계승)
- 변경: 세션 내 고유 — 같은 세션의 다른 팀에도 동일 닉네임 등록 금지
- FRD도 함께 정정: [specs/frd/team-setup-delegation.md](../specs/frd/team-setup-delegation.md) T4 — 백엔드 구현은 아직 안 됨, `[구현 반영 예정]`
- 근거: [ops/governance-gaps-2026-07-28.md](../ops/governance-gaps-2026-07-28.md) 항목 3
