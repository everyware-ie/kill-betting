---
title: 거버넌스 갭 & 이슈 모음 — 2026-07-28 회의 공유
product: kill-betting
type: ops
updated: 2026-07-28
related: [team-setup-delegation, session-settings-editable, admin-metrics-dashboard, admin-session-drilldown, 2026-07-22-session-settings-and-lifecycle]
---

# 거버넌스 갭 & 이슈 모음 — 2026-07-28 회의 공유

> 2026-07-22 회의(4그룹 작업 분배) 이후 phs00이 C그룹(team-setup-delegation) 작업을 진행하며 발견한 것들.
> 결정이 필요한 항목과 단순 공유 항목을 구분해 정리했다.
> 6번 항목(임계값 불일치)은 A그룹 PR #123 리뷰 과정에서 추가로 발견해 보강.

## 🔴 결정 필요 — 지금 실제로 벌어지고 있음: FRD approved 없이 구현 착수

**발견**: CLAUDE.md에 "approved 아닌 FRD는 구현 근거가 아니다"라는 규칙이 있었지만, 이를 기술적으로 막는 장치가 없었다. 그리고 지금 **실제로 이 규칙이 지켜지지 않고 있다**:

- A그룹([session-settings-editable.md](../specs/frd/session-settings-editable.md), 담당 jminkkk) — status 여전히 `review`. 그런데 관련 구현 PR이 이미 3건 열려 있음(kill-betting#120, #121, #122)
- D그룹([session-list-visibility.md](../specs/frd/session-list-visibility.md), 담당 JiEung2) — status 여전히 `review`. 구현 PR 2건 열려 있음(kill-betting#112, #114)

**추정 원인**: 4그룹 분배 회의 당시 "review → approved는 팀 검토 후"라는 절차 자체가 각자에게 명시적으로 공유되지 않았고, 실무적으로도 이를 강제하는 장치가 없어 다들 review 상태에서 바로 착수한 것으로 보임. C그룹(phs00)도 처음엔 같은 상태였다가, 이번에 직접 겪으며 문제를 인지하고 보완함.

**phs00이 만든 보완 장치** (kill-betting, 리뷰 대기 중):
- [PR #102](https://github.com/everyware-ie/kill-betting/pull/102) — FRD가 approved가 아니면 구현 착수(소스 편집)와 PR 생성을 훅으로 차단
- [PR #103](https://github.com/everyware-ie/kill-betting/pull/103) — #102 위에 이슈 분해 강제까지 추가 (스텁에 `이슈: #N` 필드 필수)
- 설계 원칙: "확인 체크포인트가 실행됐다"까지만 강제하고, 실제 정독은 담당자 몫. FRD 링크가 있는 스텁이 있어야 구현 소스 편집이 가능하고, 그 FRD가 approved가 아니면 PR 자체가 안 나감
- jminkkk 리뷰 반영 완료: `--body-file` 우회 경로 차단, 브랜치 타입 의존 제거(차단제외목록 방식), 테스트 파일 오탐 제거

**회의에서 정할 것**:
1. #102·#103을 병합해 전체 게이트로 적용할지
2. A·D그룹처럼 이미 review 상태에서 진행 중인 작업을 지금이라도 승격 절차를 거칠지, 그대로 진행할지
3. review → approved 승격 권한 — 각 그룹 담당자가 스스로 판단해 승격해도 되는지, 아니면 팀 전체 확인이 필요한지 (지금은 문서에 "팀 검토 후"라고만 되어 있고 방법이 불명확)

**결정사항 (2026-07-28)**: #102·#103 적용 확정 — kill-betting에 병합 진행. A·D그룹 FRD([session-settings-editable.md](../specs/frd/session-settings-editable.md), [session-list-visibility.md](../specs/frd/session-list-visibility.md))도 이번 회의 결과 반영해 `review → approved` 승격 완료(mechuri-docs PR #31). C그룹(#108→#109→#110), A그룹(#120→#121→#122→#123→#124), D그룹(#112, #114) PR 전부 리뷰 완료 → 머지 진행.

---

## 🔴 결정 필요 — admin PRD 2건이 허브 컨벤션과 다른 곳에 있음

**발견**: `kill-betting/docs/product/features/admin-metrics-dashboard.md`, `admin-session-drilldown.md`가 **허브 링크 없이 전체 PRD 원문**으로 존재한다. kill-betting#91(허브 연동, CLAUDE.md에 "features/는 허브 approved FRD의 스텁만" 규칙 신설)이 머지되기 전인 2026-07-22 15:46에 작성된 것이라, 규칙 신설 이후 마이그레이션이 안 된 상태로 남아 있다.

**선택지**:
- A. 허브로 이관 — admin PRD 원문을 허브 `specs/frd/`로 옮기고 kill-betting엔 스텁만
- B. kill-betting 유지 — 대신 허브 규칙(CLAUDE.md·docs 컨벤션)을 "레포별 예외 있음"으로 개정
- C. 혼합 — 어느 기준으로 나눌지 재정의

지난 회의에서 "다음 회의 때 정하겠다"고 미뤄둔 사안. 오늘 정해야 함.

**진행 상황 (2026-07-28)**: 오늘 회의에서 "이따가 논의"로 뒤로 미뤄짐 — 아직 미결. jminkkk가 이 안건을 생명주기 전체(기획/개발/개선 단계별 장단)로 확장한 raw 노트를 남겼다: [ideation/jminkkk/2026-07-28-docs-location-cohesion.md](../ideation/jminkkk/2026-07-28-docs-location-cohesion.md) (2026-07-31 [PR #29](https://github.com/everyware-ie/mechuri-docs/pull/29)로 main 병합 완료) — 허브 응집(현행) vs 프로젝트 응집(코드 repo로 이관) 두 방식을 비교하고, jminkkk 본인은 "전원 개발자 + 실제 사고가 repo 분리 때문에 반복됨"을 근거로 프로젝트 응집 쪽에 무게를 둠. **후속 검토 담당: phs00** — 다음 회의 전 이 raw 노트를 반영해 A/B/C 선택지 중 하나로 결론 초안을 잡아올 것.

---

## 🔴 결정 필요 — 스펙(1시간)과 구현(3시간)이 어긋남: 채널 밖 논의가 문서에 반영 안 됨

**발견**: WAITING(대기중) 세션 자동삭제 임계값을 2026-07-22 회의에서 **1시간**으로 결정했고, [decision](../decisions/2026-07-22-session-settings-and-lifecycle.md)과 [FRD S5](../specs/frd/session-settings-editable.md)에도 1시간으로 명시했다("착수 전 SQL로 근거 검증 권장"이라는 전제까지 달아둠). 그런데 실제 구현(kill-betting 이슈 [#119](https://github.com/everyware-ie/kill-betting/issues/119), PR [#123](https://github.com/everyware-ie/kill-betting/pull/123))은 **3시간**으로 들어갔고, 이슈·PR 어디에도 변경 사유나 SQL 검증 근거가 없다.

**추정 원인**: 별도 카톡 대화에서 3시간으로 재논의·적용됐고, 그 논의가 어떤 문서에도 기록되지 않은 것으로 보임(phs00 확인).

**왜 구조적 문제인가**: 이번 회의에서 병합 예정인 FRD 승인 게이트(위 항목의 kill-betting#102/#103)는 "approved 안 된 FRD로 착수"는 막아주지만, "approved FRD와 다른 값으로 구현"은 못 잡는다 — 별개 문제. git 밖(카톡 등)에서 스펙과 다른 결정이 내려지면 지금 체계로는 AI든 사람이든 감지할 방법이 없다.

**회의에서 정할 것**:
1. 이번 건은 1시간·3시간 중 무엇이 맞는 결정인지부터 확정(+ 아직 안 돌린 SQL 검증을 사후에라도 돌릴지)
2. 재발 방지 워크플로우 방향 — 후보: ⓐ PR 생성 시 관련 FRD 수치와 diff를 자동 대조해 불일치면 경고하는 훅 ⓑ 카톡 등 채널 밖 논의도 최소 한 줄은 decisions/에 남기는 규칙 ⓒ 기존 FRD-approval-gate 훅(#102/#103)에 이 체크를 얹기
   - 오늘은 방향만 정하고, 실제 장치는 방향 확정 후 별도 설계

**결정사항 (2026-07-28)**:
1. 3시간이 맞는 값으로 확정. decision·FRD 반영 완료([2026-07-22 결정 개정](../decisions/2026-07-22-session-settings-and-lifecycle.md#개정-2026-07-28), FRD S5)
2. 워크플로우 방향은 **훅이 아니라 스킬(커스텀 명령어)** 로 결정 — 훅은 트리거를 명확히 정의하기 어렵고("요구사항이 FRD와 다르다"를 기계적으로 판단하기 애매함) 강제성이 과하면 오탐으로 무시될 위험이 있다는 우려. 대신 AI가 대화 중 요구사항-FRD 불일치를 인지하면 사용자에게 안내하고, 사용자가 별도 명령어를 실행해 문서를 최신화하는 흐름으로 간다. 담당: **jminkkk**. 상세: [team/decisions/2026-07-28-frd-consistency-check-as-skill.md](https://github.com/everyware-ie/mechuri-docs/blob/main/team/decisions/2026-07-28-frd-consistency-check-as-skill.md)

---

## 🔴 결정 필요 — S1(세션 설정 편집 허용 범위)도 스펙과 어긋남, 같은 패턴 (kill-betting#124)

**발견**: FRD S1은 "목표킬·제한시간 수정은 **WAITING일 때만** 가능(그 외 400)"이라고 명시했는데, 실제 구현([kill-betting#124](https://github.com/everyware-ie/kill-betting/pull/124))은 **WAITING·IN_PROGRESS 둘 다** 수정을 허용한다(진행중 세션 수정 시 이전 확정 매치 점수는 불변이라는 별도 로직까지 추가돼 있음). 위 6번 항목(1h/3h)과 완전히 같은 패턴 — 채널 밖 논의로 스펙과 다른 범위로 구현됨.

**결정사항 (2026-07-28)**: WAITING·IN_PROGRESS 둘 다 허용하는 것이 맞는 방향으로 확정. decision·FRD 반영 완료([2026-07-22 결정 개정 #2](../decisions/2026-07-22-session-settings-and-lifecycle.md#개정-2026-07-28-2-s1-편집-허용-범위), FRD S1). 재발 방지 워크플로우는 위 6번 항목과 동일(스킬로 통합 대응).

---

## 🟡 결정 필요 — 닉네임 세션 내 중복 허용 (FRD T4 재검토 여지)

**발견**: #106(즐겨찾기·최근 닉네임 선택 UI) 작업 중 사용자 피드백으로 확인. 즐겨찾기/최근 닉네임 선택 목록에서 **이미 다른 팀에 쓰인 닉네임**이 계속 노출되는 문제가 있었음 → 세션 전체 기준으로 걸러지도록 UI는 수정 완료([kill-betting#110](https://github.com/everyware-ie/kill-betting/pull/110)).

**남은 문제**: 이건 화면단 개선일 뿐, 백엔드 검증(FRD [T4](../specs/frd/team-setup-delegation.md): *"닉네임은 팀 내 고유"*)은 여전히 **팀 단위**로만 중복을 막는다. 즉 직접 타이핑하면 같은 닉네임을 서로 다른 팀에 등록하는 게 지금도 가능하다 — 실제 배그 매칭에서 혼선을 줄 수 있음.

**결정할 것**: T4를 "세션 내 고유"로 개정할지, 아니면 UI 유도만으로 충분하다고 볼지.

**결정사항 (2026-07-28)**: 세션 내 고유로 확정(유효성 검증 필요). FRD·decision 반영 완료, 백엔드 구현은 아직 안 됨 — [team-setup-delegation.md T4](../specs/frd/team-setup-delegation.md), [2026-07-22 결정 개정](../decisions/2026-07-22-team-setup-delegation.md#개정-2026-07-28)에 `[구현 반영 예정]`으로 표시.

---

## 🟢 공유만 — 신규 FRD 헤더 문구가 허브 컨벤션과 충돌했음 (C그룹은 수정 완료)

**발견**: review 상태 FRD들의 헤더에 *"status: `review` — 신규 개발 항목, **구현 후** `approved`로 전환"*이라는 문구가 있는데, 이는 허브 컨벤션(*"approved만 구현 근거로 유효"*)과 정반대다. 기존 approved FRD(`session.md` 등)는 이미 배포된 코드를 **역문서화**한 것이라 자연히 "구현 후 approved"였는데, 그 문구가 신규 기능 FRD 템플릿에 그대로 복사된 것으로 추정.

**확인 결과** — 아직 A·B·D 세 곳에 남아 있음:
- [session-settings-editable.md](../specs/frd/session-settings-editable.md) (A, jminkkk)
- [match-history-v2.md](../specs/frd/match-history-v2.md) (B, phs00 — 다음 착수 예정)
- [session-list-visibility.md](../specs/frd/session-list-visibility.md) (D, JiEung2)

C그룹([team-setup-delegation.md](../specs/frd/team-setup-delegation.md))은 approved 승격하며 *"status: `approved`(2026-07-25 승격) — 구현 근거로 유효하다"*로 정정함([mechuri-docs#27](https://github.com/everyware-ie/mechuri-docs/pull/27)).

**제안**: 각자 담당 FRD를 approved로 승격할 때 같이 정정하면 될 것 같음. 급한 사안 아님.

---

## 🟢 공유만 — kill-betting#107: 비호스트에게 "팀 추가" 버튼 노출 (이슈 등록 완료)

#104(팀 구성 권한 위임) 작업 중 발견. `room/[id]/setup`의 "팀 추가" 버튼이 `isHost` 체크 없이 렌더링되어, 리더나 일반 참여자가 눌러도 서버가 조용히 거부한다(사용자 입장에선 "눌러도 반응 없음"으로 보임). 기존부터 있던 버그.

→ [kill-betting#107](https://github.com/everyware-ie/kill-betting/issues/107)로 별도 등록. 담당 미정, 우선순위 낮음(#104 스코프 오염 방지 위해 분리).

---

## 🟢 공유만 — 로컬 환경 노트 2건

1. **허브 로컬 클론 폴더명 불일치**: repo가 `ideation-wiki` → `mechuri-docs`로 rename됐는데, 로컬 클론 폴더명은 그대로 남아있는 경우가 있다(이번에 phs00 로컬은 `mechri-docs`로 오타까지 있어 한동안 "클론이 없다"고 착각함). 다들 로컬 폴더가 원격과 헷갈리지 않는 이름인지 한 번씩 확인 권장.
2. **로컬 백엔드 DB가 재시작마다 초기화됨**: `application-local.yml`의 `ddl-auto: create-drop` 때문에 docker backend를 재빌드/재시작할 때마다 테스트 계정·데이터가 전부 사라진다. 버그는 아니고 설정 특성이지만, 반복 검증 시 계정을 매번 다시 만들어야 해서 인지하고 있으면 좋음.

---

## 🟢 공유만 — 신규 QA: 운영(admin) 메뉴 조작이 잘 적용되지 않는 현상

2026-07-28 회의에서 보고됨: 운영 메뉴에서 조작한 내용이 실제로 잘 반영되지 않는 경우가 있다. 재현 조건·원인 미확인. 담당 미정, 우선순위 낮음 — [ops/admin-and-tooling.md](admin-and-tooling.md)에 QA 항목으로 등록.

---

## 🟡 주의 — PR #114와 jminkkk 작업 파일 충돌 가능성

2026-07-28 회의에서 언급: kill-betting repo에서 AI를 이용한 PR 머지를 진행하기 전에, JiEung2의 #114와 jminkkk의 작업(A그룹 PR들)이 같은 파일을 건드려 머지 충돌이 날 수 있다는 우려가 나옴. 실제 머지 진행 시 이 조합부터 먼저 확인 권장.

---

## PR 큐 현황 (2026-07-28 회의 결과 반영)

| PR | 브랜치 | 내용 | 상태 |
|---|---|---|---|
| [#102](https://github.com/everyware-ie/kill-betting/pull/102) | phs00/chore/frd-approval-gate | FRD 승인 게이트 | 리뷰 완료 → 머지 진행 |
| [#103](https://github.com/everyware-ie/kill-betting/pull/103) | phs00/chore/issue-linkage-gate | 이슈 분해 게이트 (#102 stacked) | 리뷰 완료 → 머지 진행 |
| [#108](https://github.com/everyware-ie/kill-betting/pull/108) | phs00/feature/team-config-delegation | C그룹 — #104 | 리뷰 완료 → 머지 진행 |
| [#109](https://github.com/everyware-ie/kill-betting/pull/109) | phs00/feature/favorite-nickname | C그룹 — #105 | 리뷰 완료 → 머지 진행 |
| [#110](https://github.com/everyware-ie/kill-betting/pull/110) | phs00/feature/favorite-in-setup | C그룹 — #106 (#108·#109 위 stacked) | 리뷰 완료 → 머지 진행 |
| [#112](https://github.com/everyware-ie/kill-betting/pull/112), [#114](https://github.com/everyware-ie/kill-betting/pull/114) | JiEung2/... | D그룹 관련 | 리뷰 완료 → 머지 진행 (⚠️ jminkkk 작업과 파일 충돌 가능성, 위 항목 참고) |
| [#120](https://github.com/everyware-ie/kill-betting/pull/120)~[#124](https://github.com/everyware-ie/kill-betting/pull/124) | jminkkk/... | A그룹 관련 (#123: 임계값 1h→3h, #124: S1 편집범위 — 둘 다 회의에서 결정 확정) | 리뷰 완료 → 머지 진행 |

C그룹 3건은 **#108 → #109 → #110 순서**로 머지해야 한다(스택 구조).
A그룹은 **#120 → #121 → #122 → #123 순서**로 머지해야 한다(스택 구조, PR #123 본문 명시). #124는 `main` 기준 독립 브랜치라 순서 제약 없음.
