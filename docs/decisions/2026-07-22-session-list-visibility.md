---
title: 대기중 세션의 "내 세션 목록" 노출
product: kill-betting
type: decision
status: decided
date: 2026-07-22
related_meeting: products/kill-betting/meetings/2026-07-22/synthesis.md
tags: [kill-betting, dashboard, bugfix]
---

# 대기중 세션의 "내 세션 목록" 노출

## 배경

관련 회의: [2026-07-22 회의 종합](../meetings/2026-07-22/synthesis.md)

인터뷰에서: 킬내기 시작 전 대기 상태인 방에 참여자로 들어갔는데 대시보드 "내 세션" 목록에서 조회가 안 됨. 코드 확인 결과 `getMySessions`는 Host이거나 `SessionUser` 테이블에 있는 사람만 조회하는데, `SessionUser`는 세션이 실제로 시작될 때(`startSession()`)만 생성됨 — 대기중 참여자는 아직 SessionUser가 없어 목록에서 빠지는 게 정확히 재현됨. **지응 자체 진단**: "leader인 방 조회하는 건줄 알았는데 session id만 가져와서 세션 전체에 추가가 안 되네" — 관련 코드를 이미 짚어둔 상태(스크린샷은 회의 중 공유, 레포 미첨부).

추가로 phs00 의견: 방 나가기 기능, 대기 중 상태에서 대시보드로 돌아가는 UX(좌측 상단 로고 클릭 등)가 없어 이 영역과 함께 다뤄야 할 것으로 판단.

## 결정

- **참여자가 세션에 입장하는 시점**(대기실 진입)에 이미 "내 세션"으로 조회되도록 한다. `SessionUser` 생성 시점을 시작 시가 아니라 **입장 시**로 앞당기거나, 별도의 "대기중 참여" 추적 방식을 추가한다(구체 설계는 FRD에서, 지응의 코드 진단부터 확인)
- **방 나가기 기능**을 추가한다
- **대기 중 상태에서 대시보드로 복귀하는 내비게이션**(로고 클릭 등)을 추가하고, 이에 맞춰 방 나가기 UX도 함께 정리한다

## 다음 액션

- FRD 상세: [specs/frd/session-list-visibility.md](../specs/frd/session-list-visibility.md)
- 담당: **JiEung2**
- `SessionUser` 생성 시점 변경이 `startSession()`의 다른 로직(리더/팀원 검증 등)에 영향 없는지 확인 필요
- 지응이 이미 짚어둔 코드 위치부터 재확인 후 착수
