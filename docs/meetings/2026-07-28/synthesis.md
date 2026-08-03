---
title: 2026-07-28 회의 종합 — 4그룹 진행 현황 점검 & 거버넌스 갭 해소
product: kill-betting
type: meeting
updated: 2026-07-28
participants: [JiEung2, jminkkk, phs00]
tags: [kill-betting, governance, spec-sync, workflow]
---

# 2026-07-28 회의 종합 — 4그룹 진행 현황 점검 & 거버넌스 갭 해소

## 요약

2026-07-22 회의에서 나눈 4그룹 작업의 진행 상황을 점검하고, 그 과정에서 발견된 거버넌스 갭([ops/governance-gaps-2026-07-28.md](../../ops/governance-gaps-2026-07-28.md))을 회의 안건으로 다뤘다. 핵심은 두 건의 스펙-구현 불일치(WAITING 자동삭제 1h→3h, 세션 설정 편집 범위)가 전부 **채널 밖(카톡) 논의가 문서에 반영되지 않아** 생긴 것이었다는 점 — 이를 계기로 재발 방지 워크플로우 방향을 정했다(훅이 아니라 스킬). 그 외 B그룹 담당 이관, 닉네임 세션 내 고유 확정, admin 문서 위치 논의는 다음 회의로 이월.

## 이전 TODO 갱신

| 그룹 | 충돌 방지 단위(파일) | 포함 항목 | 담당 | 구현 여부 |
|---|---|---|---|---|
| A. 세션 생명주기·설정 | [session-settings-editable.md](../../specs/frd/session-settings-editable.md) | 설정변경 미반영 · 진행중 6h 무응답 자동종료 · 대기중 3h 자동삭제(1h→3h 변경) · 방 삭제 · 설정 편집 WAITING+진행중 확대 | **jminkkk** | O — [#120](https://github.com/everyware-ie/kill-betting/pull/120)~[#124](https://github.com/everyware-ie/kill-betting/pull/124), 리뷰 완료 → 머지 진행 |
| B. 매치 히스토리 v2 | [match-history-v2.md](../../specs/frd/match-history-v2.md) | 팀별 분리 표시 + 삭제 기능 | ~~phs00~~ → **JiEung2** (이관) | 미착수 (1순위) |
| C. 팀 구성 위임 | [team-setup-delegation.md](../../specs/frd/team-setup-delegation.md) | 리더 권한 위임 · 닉네임 즐겨찾기 | **phs00** | O — [#108](https://github.com/everyware-ie/kill-betting/pull/108)→[#109](https://github.com/everyware-ie/kill-betting/pull/109)→[#110](https://github.com/everyware-ie/kill-betting/pull/110), 리뷰 완료 → 머지 진행 |
| D. 세션 목록·참여 UX | [session-list-visibility.md](../../specs/frd/session-list-visibility.md) | 대시보드 미조회 · 방 나가기(→숨기기로 축소) · 대기중 대시보드 복귀 UX | **JiEung2** | O — [#112](https://github.com/everyware-ie/kill-betting/pull/112), [#114](https://github.com/everyware-ie/kill-betting/pull/114), 리뷰 완료 → 머지 진행 |

**B그룹 담당 이관 사유**: phs00은 C그룹에 이어 거버넌스 훅(#102/#103) 작업까지 맡아 우선순위상 B그룹 착수가 밀림 → JiEung2가 D그룹 완료 후 순번상 다음으로 이관받음.

## 인당 작업 현황 (2026-07-22 회의 이후)

**jminkkk — A그룹 + 기존 admin 트랙**
- admin 대시보드(7/22 이전 착수, 이미 병합): [#97](https://github.com/everyware-ie/kill-betting/pull/97)~[#101](https://github.com/everyware-ie/kill-betting/pull/101)
- A그룹: [#120](https://github.com/everyware-ie/kill-betting/pull/120) 폴링 배치 전환 · [#121](https://github.com/everyware-ie/kill-betting/pull/121) 방 삭제+soft delete · [#122](https://github.com/everyware-ie/kill-betting/pull/122) 무응답 6h 자동종료 · [#123](https://github.com/everyware-ie/kill-betting/pull/123) 대기중 3h 자동삭제(스펙 불일치 발견·확정) · [#124](https://github.com/everyware-ie/kill-betting/pull/124) 설정 편집(스펙 불일치 발견·확정) — 전부 리뷰 완료 → 머지 진행

**JiEung2 — D그룹**
- [#112](https://github.com/everyware-ie/kill-betting/pull/112) 리더 전용 WAITING 세션이 "내 세션" 목록 누락 수정
- [#114](https://github.com/everyware-ie/kill-betting/pull/114) "내 세션" 목록 숨기기 기능
- 리뷰 완료 → 머지 진행. 방 나가기 기능은 별도 정책 고도화 필요하다는 의견 나옴(추후 논의)
- 다음 착수: B그룹(match-history-v2) 이관받음

**phs00 — C그룹 + 거버넌스 훅**
- C그룹: [#108](https://github.com/everyware-ie/kill-betting/pull/108)→[#109](https://github.com/everyware-ie/kill-betting/pull/109)→[#110](https://github.com/everyware-ie/kill-betting/pull/110), 리뷰 완료 → 머지 진행
  - 2순위 QA로 접수: 즐겨찾기 UI 가독성(구분이 잘 안 됨), 즐겨찾기 추가/삭제 플로우 개선(최근 함께한 리스트 → 즐겨찾기 전환 UX)
- 거버넌스 훅 [#102](https://github.com/everyware-ie/kill-betting/pull/102)/[#103](https://github.com/everyware-ie/kill-betting/pull/103): 리뷰 완료 → 머지 진행. AI 워크플로우 강화 트랙으로 자리매김
- 후속 액션: docs 위치 논의(jminkkk raw 노트) 검토 — 아래 참고

## 이슈 논의 결과

상세 배경은 [ops/governance-gaps-2026-07-28.md](../../ops/governance-gaps-2026-07-28.md) 참고. 결정만 요약:

1. **FRD approved 없이 구현 착수 갭** — #102·#103 적용 확정(병합 진행). A·D그룹 FRD도 이번에 approved로 승격(mechuri-docs #31).
2. **admin PRD 2건 위치(허브 vs 코드 repo)** — **이따가 논의로 미룸, 오늘 미결.** jminkkk가 이 안건을 "문서를 어느 repo에 둘 것인가"로 확장한 raw 노트를 남김: [ideation/jminkkk/2026-07-28-docs-location-cohesion.md](../../ideation/jminkkk/2026-07-28-docs-location-cohesion.md) (2026-07-31 [PR #29](https://github.com/everyware-ie/mechuri-docs/pull/29)로 main 병합 완료). **후속 검토 담당: phs00** — 다음 회의 전 결론 초안 준비.
3. **닉네임 세션 내 중복 허용** — 세션 내 고유로 확정(유효성 검증 필요, 반영 예정). FRD T4·decision 개정 완료, 백엔드 구현은 아직.
4. **신규 FRD 헤더 문구 충돌** — 공유만, 급하지 않음(승격 시 정정).
5. **비호스트 "팀 추가" 버튼 노출 버그** — [kill-betting#107](https://github.com/everyware-ie/kill-betting/issues/107) 등록 완료, 담당 미정.
6. **스펙(1h)-구현(3h) 불일치 + 재발 방지 워크플로우** — 3시간이 맞는 값으로 확정, 문서 반영 완료. 재발 방지는 **스킬(커스텀 명령어)** 로 결정, 담당 jminkkk. 훅은 트리거 정의가 애매하고 과한 강제성이 오탐으로 무시될 위험이 있어 기각. AI가 요구사항-FRD 불일치를 인지하면 안내하고, 사용자가 별도 명령어로 문서를 최신화하는 흐름. 상세: [team/decisions/2026-07-28-frd-consistency-check-as-skill.md](https://github.com/everyware-ie/mechuri-docs/blob/main/team/decisions/2026-07-28-frd-consistency-check-as-skill.md)
7. **S1(세션 설정 편집 범위)도 같은 패턴으로 불일치 발견** ([kill-betting#124](https://github.com/everyware-ie/kill-betting/pull/124)) — WAITING·IN_PROGRESS 둘 다 허용이 맞는 방향으로 확정, 문서 반영 완료.

## 신규 QA / 주의사항

- **운영 메뉴 조작 미반영 현상**: 어드민 메뉴에서 조작한 내용이 실제로 잘 적용되지 않는 경우가 있다고 보고됨. 재현 조건·원인 미확인, 담당 미정, 우선순위 낮음 — [ops/admin-and-tooling.md](../../ops/admin-and-tooling.md)에 등록.
- **머지 순서 주의**: kill-betting repo에서 AI를 이용한 PR 머지를 진행하기 전에, PR #114(JiEung2)와 jminkkk의 A그룹 작업이 같은 파일을 건드려 충돌 날 수 있다는 우려가 나옴 — 실제 머지 시 이 조합부터 먼저 확인.

## 다음 회의까지 액션

- [ ] phs00: docs 위치(허브 vs 프로젝트 응집) — jminkkk raw 노트 반영해 결론 초안 준비
- [ ] JiEung2: B그룹(match-history-v2) 착수
- [ ] jminkkk: FRD-구현 정합성 체크 스킬 설계·구현
- [ ] phs00/C그룹: 닉네임 세션 내 고유 백엔드 검증 구현, 즐겨찾기 UI 가독성·플로우 개선(2순위 QA)
- [ ] 팀: kill-betting PR 큐 전체 머지 진행(#114-jminkkk 충돌 가능성 먼저 확인)
- [ ] 담당 미정: kill-betting#107(비호스트 팀추가 버튼), 운영메뉴 조작 미반영 현상
