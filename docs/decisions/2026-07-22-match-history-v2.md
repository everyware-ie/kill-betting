---
title: 매치 히스토리 팀별 분리 & 삭제 기능 도입
product: kill-betting
type: decision
status: decided
date: 2026-07-22
related_meeting: products/kill-betting/meetings/2026-07-22/synthesis.md
tags: [kill-betting, match-history]
---

# 매치 히스토리 팀별 분리 & 삭제 기능 도입

## 배경

관련 회의: [2026-07-22 회의 종합](../meetings/2026-07-22/synthesis.md)

인터뷰에서: 매치 히스토리가 팀 구분 없이 하나로 합쳐져 있어 A팀/B팀 어느 쪽 기록인지 알 수 없음. 잘못 체크해서 올린 기록을 고칠 방법이 없어 곤란. 코드 확인 결과 응답 DTO에 팀 구분 필드가 없고, 삭제 엔드포인트가 전체 코드에 0건.

## 결정

- 매치 히스토리 응답에 **팀 구분 정보를 추가**하고, 화면에서 팀별로 분리해서 보여준다
- 팀 리더가 **본인 팀의 확정된 매치를 삭제**할 수 있게 하고, 삭제 후 재업로드로 이어지게 한다

## 다음 액션

- FRD 상세: [specs/frd/match-history-v2.md](../specs/frd/match-history-v2.md)
- 담당: ~~phs00~~ → **JiEung2** (2026-07-28 회의에서 이관 — phs00은 C그룹에, JiEung2는 D그룹 완료 후 순번상 다음 착수)
- 삭제 시 이미 반영된 팀 점수(킬 수·룰 점수)를 되돌리는 로직 설계 필요(단순 레코드 삭제만으로는 점수가 안 맞음)
