---
title: 2026-07-22 회의 종합 — 킬내기 사용자 인터뷰 후속 & 작업 분배
product: kill-betting
type: meeting
updated: 2026-07-22
participants: [JiEung2, jminkkk, phs00]
tags: [kill-betting, interview, qa, feature-split]
---

# 2026-07-22 회의 종합 — 킬내기 사용자 인터뷰 후속 & 작업 분배

## 요약

JiEung2가 진행한 킬내기 실사용자 인터뷰 결과 + phs00의 추가 의견을 종합했다. 각자 AI를 활용해 병렬로 작업할 예정이라, git 충돌을 피하기 위해 **기능 영역별 4개 그룹**으로 나누고 그룹마다 독립된 FRD 파일 + 담당자를 배정했다.

## 인터뷰 원문 (지응, 6건 + phs00 추가의견 1건)

1. **(오류)** 시간제한을 안 풀고 방을 팠다가 설정에서 제한을 풀고 진행했는데 적용이 안 되고, 시간이 지난 후 킬내기가 끝나버림 — 방 생성 이후 설정 변경이 적용 안 되는 것처럼 보임. **단, 재테스트 결과 적용되는 것처럼 보이기도 함** — 아래 5번(제한시간 자체가 아예 작동 안 함)과 관련 있을 것으로 추정, 재현 조건 확인 필요
2. **매치 히스토리 기능 고도화** — 기록 올린 다음 수정할 방도가 없어 실수로 잘못 체크해서 올리면 처리 곤란. 히스토리가 하나로 합쳐져 있어 A팀/B팀 구분이 안 됨. 팀별로 분리해서 보였으면 함. 본인 팀 것은 삭제 후 재업로드할 수 있는 X버튼이 있으면 좋겠음
3. **방 설정 권한 고도화** — 팀 구분·닉네임 기입을 방장만 할 수 있는데, 리더가 된 사람은 본인 팀의 팀원을 직접 추가할 수 있었으면 함(방장이 계속 다 쓰기 힘듦)
4. **닉네임 즐겨찾기** — 같은 멤버가 매번 반복되니 즐겨찾기로 딸깍 추가하고 싶음(타자 치기 귀찮음)
5. **방 세션 종료 정책 고도화**
   - 세션 시작 후 **마지막 매치 등록 시점 기준 6시간** 동안 액션 응답이 없으면 자동 종료(마지막 행동은 매치 등록으로만 정의 — 범위 확대 우려로 명시적으로 제한)
   - **방 생성 후 1시간** 동안 세션이 시작되지 않으면 **자동 삭제**(WAITING 상태 방치 방 정리)
   - 임계값 근거 확보용 SQL 쿼리(평균/중앙값·p90/원본 리스트)는 [session-settings-editable.md §7](../../specs/frd/session-settings-editable.md)에 보존
6. **대시보드 방 목록 조회 고도화** — 킬내기 시작 전 대기 상태인 방에 참여자로 들어갔을 때 목록에서 조회되지 않음
   - **지응 자체 진단**: "leader인 방 조회하는 건줄 알았는데 session id만 가져와서 세션 전체에 추가가 안 되네, 그래서 목록에 안 나오는 듯" — 코드 위치는 회의 중 캡처한 스크린샷 참고(레포에 미첨부, 담당자가 재확인)
7. **추가 의견 (phs00)**
   - 방 나가기 기능
   - 방 삭제하기 기능
   - 대기 중 상태에서 방에 입장했을 때 대시보드로 돌아가는 UX 부재 (예: 좌측 상단 로고 클릭 시 대시보드 이동) — 이 UX 변경 시 "방 나가기" UX도 함께 재정리 필요할 것으로 추정

## 별도 트랙 (새 FRD 불필요 — 참고용)

| 항목 | 상태 | 처리 |
|---|---|---|
| **top10 팀단위 페널티** — 인당 감점이 아니라 팀 전체 1회 감점 옵션 추가 | JiEung2가 이미 구현, **[kill-betting#93](https://github.com/everyware-ie/kill-betting/pull/93) 생성 · 리뷰 대기 중**(머지 안 됨) | 새 작업 배정 불필요 — 리뷰·머지만 필요. 머지되면 [match-confirm.md](../../specs/frd/match-confirm.md) C6 갱신 |
| **어드민 페이지** | jminkkk 완료 — `https://killnagi.duckdns.org/admin` | 액션 불필요. **계정 정보는 문서에 기록하지 않음**(보안 정책, [team/conventions.md](https://github.com/everyware-ie/mechuri-docs/blob/main/team/conventions.md) 참고). 추가 고도화 예정(별도 논의) |
| **kill-betting repo 신규 하네스** | jminkkk 추가 — 앱에서 명시적으로 드러나지 않음, 확인 후 팀에 공유 예정 | jminkkk 확인 후 노티 대기 |
| **런타임 에러 로그 강화** | 현재 로그가 한정적이라 원격에서 버그를 확인해 GitHub 이슈로 등록하기 어려움 | 4개 그룹과 코드 영역이 겹치지 않는 별도 인프라 이슈 — 우선순위 낮음, 여유 있는 사람이 픽업 |

## 기능 영역 분류 & 담당자 배정 (4그룹)

| 그룹 | 인터뷰 항목 | FRD 파일 | 담당 |
|---|---|---|---|
| **A. 세션 생명주기·설정** | 1(설정변경 미반영, 재확인 필요) · 5(6시간 무응답 자동종료 · 1시간 미시작 자동삭제) · 7-방삭제 기능 | [session-settings-editable.md](../../specs/frd/session-settings-editable.md) | **jminkkk** |
| **B. 매치 히스토리 v2** | 2(팀별 분리 표시 + 삭제) | [match-history-v2.md](../../specs/frd/match-history-v2.md) | **phs00** |
| **C. 팀 구성 위임** | 3(리더 권한 위임) · 4(닉네임 즐겨찾기) | [team-setup-delegation.md](../../specs/frd/team-setup-delegation.md) | **phs00** |
| **D. 세션 목록·참여 UX** | 6(대시보드 미조회 + 지응 진단) · 7-방나가기 · 7-대시보드 복귀 UX | [session-list-visibility.md](../../specs/frd/session-list-visibility.md) | **JiEung2** |

## 결정 사항

→ [decisions/2026-07-22-session-settings-and-lifecycle.md](../../decisions/2026-07-22-session-settings-and-lifecycle.md)
→ [decisions/2026-07-22-match-history-v2.md](../../decisions/2026-07-22-match-history-v2.md)
→ [decisions/2026-07-22-team-setup-delegation.md](../../decisions/2026-07-22-team-setup-delegation.md)
→ [decisions/2026-07-22-session-list-visibility.md](../../decisions/2026-07-22-session-list-visibility.md)

## 다음 액션

- [ ] jminkkk: 신규 하네스 확인 후 팀에 공유
- [ ] jminkkk: A그룹 착수 전 제한시간 미작동 원인을 서버 로그로 먼저 확인, 세션 생성→시작 소요시간 SQL로 자동삭제(1시간) 임계값 근거 확보
- [ ] JiEung2: kill-betting#93 리뷰/머지, D그룹 착수(이미 진단한 코드 위치부터)
- [ ] phs00: B·C그룹 착수 — 부담되면 우선순위 낮은 쪽(C) 재배분 논의
- [ ] 에러 로그 강화는 4개 그룹 완료 후 또는 여유 있는 사람이 픽업
