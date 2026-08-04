# CLAUDE.md

## 서비스 개요
배틀그라운드 킬내기 세션 점수 자동 계산 서비스.
팀들이 매치 결과 이미지를 업로드하면 세션 룰에 따라 점수를 자동 집계한다.

## 기획 문서의 정본 (이 레포)

기능의 **무엇·왜**(정책·기능정의·요구사항)는 이 레포의 `docs/specs/frd/`가 유일한 진실이다.
아이디에이션 → 회의 → 결정 → 스펙 → 구현이 **한 레포 안에서** 이어진다.

- `docs/specs/frd/` — 기능정의서(FRD). **approved만 구현 근거**다. draft/review는 아니다
- `docs/specs/prd/` — 제품 요구 문서(PRD)
- `docs/product/features/` — 기능별 **구현 노트**(FRD 링크 + 코드 구조·기술 선택). 규칙 원문을 복사하지 않는다
- `docs/decisions/`, `docs/meetings/`, `docs/topics/`, `docs/ideation/<닉네임>/` — 결정·회의·주제 종합·개인 raw

스펙과 구현이 같은 레포에 있으므로, **불일치를 발견하면 같은 PR에서 함께 고치는 것을 기본**으로 한다(이전에는 별도 repo라 이슈를 만들어 넘겨야 했다).

> **2026-08-03 이관**: 이전에는 허브 [mechuri-docs](https://github.com/everyware-ie/mechuri-docs)의 `products/kill-betting/specs/`가 정본이고 이 레포는 스텁만 뒀다. 그 교차 repo 링크 4건이 전부 조용히 깨져 있었던 것이 확인되어 구조를 바꿨다. 배경·근거: [2026-08-03 결정](https://github.com/everyware-ie/mechuri-docs/blob/main/team/decisions/2026-08-03-ideation-pipeline-location.md)

### 허브에 남는 것

- **제품 대장**(어느 제품이 어느 repo인지) · **팀 공통 프로세스 결정·컨벤션** · **여러 제품 통합 회의 기록** · 노션 이관 아카이브

### 아이디에이션 규약

- 브랜치 **`idea/<닉네임>`**(개인 상시, 머지 후 재사용), 경로 **`docs/ideation/<본인 닉네임>/`**
- raw는 불변 — 고쳐 쓰지 않고 새 노트로 보완. 타인 폴더는 읽기 전용

### 강제 게이트 (훅으로 자동 적용)

approved FRD라도 착수 전 확인 단계를 건너뛰지 못하도록 두 지점에서 훅이 강제한다:

1. **구현 착수 시점** (`pre-implementation-frd-check.sh`): 구현 메인 소스(`backend/src/main`·`frontend/{app,components,features,lib}`)를 편집할 때, **이 브랜치에** 확인 노트(`docs/product/features/<기능>.md`, FRD 링크 포함)가 하나도 없으면 편집이 차단된다. 테스트 파일(`*.test.js`·`*.spec.js`·`backend/src/test`)은 대상 아님(TDD test-first 허용), 브랜치 타입 `chore`·`docs`는 면제. 노트를 만들려면 `docs/specs/frd/`의 FRD를 가져와 사용자에게 보여주고 확인받는 단계를 거쳐야 한다. **"바로 진행"으로도 이 단계는 건너뛸 수 없다.**
2. **PR 생성 시점** (`pre-pr-checklist.sh`): PR이 참조하는 FRD(본문·`--body-file`·이 브랜치의 구현 노트 링크에서 수집)의 `status`가 `approved`가 아니면 PR 생성이 차단된다.

> 두 훅은 2026-08-03 이관에 맞춰 **로컬 `docs/specs/frd/` 경로를 인식**하도록 갱신됐다. 이관 전 형식(허브 절대 URL)도 하위호환으로 계속 인정한다.

훅이 강제하는 수준은 정직하게 다음까지다:
- 강제함: "이 브랜치에서 FRD 확인 체크포인트가 최소 1회 실행됐다"
- 강제 못 함(범위 밖): 편집 중인 소스가 정확히 그 스텁의 기능인지(파일→기능 매핑), 사람이 실제로 정독했는지 — 즉 파일 단위가 아니라 **브랜치 단위** 체크포인트다.

## 팀 & 스택
- 백엔드: Java / Spring Boot
- 프론트엔드: React / Next.js
- 레포: 모노레포 (FE + BE 단일 레포)
- 개발 방식: 사이드 프로젝트 / 2주 애자일 스프린트

## 레포 구조
```
/
├── backend/
├── frontend/
├── docs/
│   ├── ideation/<닉네임>/    # 개인 아이디어 원문 (raw, 불변)
│   ├── meetings/             # 회의 종합
│   ├── decisions/            # 의사결정
│   ├── specs/
│   │   ├── frd/              # 기능정의서 — 구현 근거 (approved만 유효)
│   │   └── prd/              # 제품 요구 문서
│   ├── topics/               # 주제별 종합
│   ├── ops/                  # 운영 (어드민·도구·거버넌스)
│   ├── marketing/
│   ├── architecture/
│   │   ├── erd/              # ERD (current.mermaid, v1.mermaid)
│   │   └── adr/              # 아키텍처 결정 기록
│   ├── backend/
│   │   ├── conventions.md    # 백엔드 코딩 컨벤션
│   │   ├── architecture.md   # 아키텍처 규칙 + 예외 처리
│   │   ├── layers.md         # 레이어별 지침
│   │   └── tests.md          # 테스트 전략
│   ├── frontend/
│   │   └── conventions.md    # 프론트엔드 코딩 컨벤션
│   ├── product/
│   │   └── features/         # 기능 명세 (FRD)
│   ├── team/
│   │   └── workflow.md       # 개발 워크플로우
│   └── common/
│       ├── docs-convention.md # 문서화 트리거 가이드
│       ├── tech-debt.md       # 기술 부채 & PR 변경 이력
│       └── retrospect/        # 스프린트 회고
├── .claude/
│   ├── conventions/
│   │   └── git.md            # Git 브랜치/커밋 규칙
│   ├── domain/
│   │   └── glossary.md       # 도메인 용어 사전
│   └── status.md             # 현재 개발 진행 상태
└── CLAUDE.md
```

---

## 핵심 도메인 용어
> 전체 용어 정의 → @.claude/domain/glossary.md

| 용어 | 한 줄 설명 |
|------|-----------|
| Session | 하나의 킬내기 이벤트 (여러 Match 포함) |
| Match | 배그 한 판 결과 |
| SessionRule | 세션별 점수 계산 룰 정의 |
| MatchResult | 이미지에서 파싱된 한 판 데이터 |
| ScoreBoard | 세션 내 누적 점수 집계 |
| Participant | 세션 참여 유저 또는 팀 |

---

## 작업 유형별 참조 파일

> 작업 시작 전 해당하는 파일을 먼저 읽을 것.

| 작업 상황 | 읽어야 할 파일                                |
|-----------|-----------------------------------------|
| Git 브랜치 생성 / 커밋 / PR | @.claude/conventions/git.md              |
| 백엔드 코드 작성 / 리뷰 | @docs/backend/conventions.md             |
| 백엔드 레이어 구현 (Controller / Service 등) | @docs/backend/layers.md    |
| 백엔드 테스트 작성 | @docs/backend/tests.md                      |
| 프론트엔드 테스트 작성 | @docs/frontend/tests.md                   |
| 아키텍처 규칙 / 예외 처리 확인 | @docs/backend/architecture.md        |
| 프론트엔드 코드 작성 / 리뷰 | @docs/frontend/conventions.md            |
| 도메인 용어가 불명확할 때 | @.claude/domain/glossary.md              |
| 현재 개발 상태 파악 | @.claude/status.md                       |
| 기능 명세 확인 (FRD) | @docs/specs/frd/                         |
| 제품 요구 문서 (PRD) | @docs/specs/prd/                         |
| 기능별 구현 노트 | @docs/product/features/                      |
| 지금까지의 결정 확인 | @docs/decisions/index.md                 |
| 회의 기록 확인 | @docs/meetings/                                |
| 현재 ERD 확인 | @docs/architecture/erd/current.mermaid   |
| 기술 부채 / PR 변경 이력 확인 | @docs/common/tech-debt.md           |
| 문서 업데이트 기준 확인 | @docs/common/docs-convention.md      |
| 코드 리팩토링 / 구조 개선 | `/improve-codebase-architecture` 실행  |

---

## AI 팀 컨벤션

### 팀 구성

| 팀원 | 역할 |
|------|------|
| (팀원1) | 풀스택 (기능 단위 전담) |
| (팀원2) | 풀스택 (기능 단위 전담) |
| (팀원3) | 풀스택 (기능 단위 전담) |

기능은 한 사람이 기획·백엔드·프론트엔드를 모두 구현한다.
작업 시작 전 GitHub 이슈에 본인을 assign한다 — AI 작업도 동일하게 적용.

### 도메인 언어

작업 전 반드시 `.claude/domain/glossary.md`를 읽는다.
코드·커밋·PRD 전반에서 용어집의 표현을 그대로 사용한다.
새 용어가 생기면 팀 합의 후 glossary.md에 추가한다.

### 기능 시작 워크플로우

기능 구현 전 아래 순서를 따른다:

1. `/feature-start` — 요구사항 그릴링 + 설계 (한 세션)
2. `/to-prd` — 세션 내용을 PRD로 정리
3. `/to-issues` — PRD를 독립 이슈로 분해 후 GitHub에 등록
4. `tdd` — 이슈 단위로 구현

**PRD 없이 구현 시작 금지.**
PRD는 `docs/specs/prd/`에, FRD는 `docs/specs/frd/`에 저장한다. `docs/product/features/`는 **구현 노트** 전용이다.

### AI 구현 가이드

코드 작성 전:
- 해당 기능의 FRD/PRD 확인 (`docs/specs/frd/`, `docs/specs/prd/`) + 기존 구현 노트 (`docs/product/features/`)
- `.claude/domain/glossary.md`에서 도메인 용어 확인
- `docs/architecture/adr/`에서 관련 아키텍처 결정 확인

구현 후:
- PRD 사용자 스토리를 하나씩 검토하며 구현이 일치하는지 확인
- PRD와 다르게 구현했다면 이슈 또는 새 ADR에 이유를 기록

### 스펙-구현 정합성 (drift 감지·안내)

approved FRD가 있어도 실제 구현·논의가 그와 다른 값·규칙으로 흘러가는 사고가 반복됐다(임계값 1h↔3h, 편집범위 WAITING↔진행중). 원인은 **git 밖 채널(카톡 등)에서 결정이 바뀌었는데 어떤 문서에도 반영되지 않은 것**이다. FRD 승인 게이트(훅)는 "approved 안 된 FRD로 착수"는 막지만 "approved FRD와 다른 내용으로 구현"은 못 잡는다 — 이 지침이 그 공백을 메운다.

> 배경·결정: [2026-07-28 — 정합성 체크는 훅이 아니라 스킬로](docs/ops/governance-gaps-2026-07-28.md). 훅으로 강제하지 않는 이유는 "요구사항이 FRD와 다르다"를 기계적으로 판단하기 어렵고 오탐이 잦으면 무시되기 때문이다. 대신 **AI가 대화 중 감지 → 사용자에게 안내 → 사용자가 확정 시 `/sync-frd`로 문서 최신화**로 간다.

**AI는 FRD 링크된 작업(구현 노트가 가리키는 FRD가 있는 작업) 중, 구현하거나 논의하는 요구사항이 FRD의 값·규칙과 다른 것을 인지하면 즉시 멈추고 사용자에게 안내한다. 사용자가 확정하기 전에는 그 부분의 구현을 진행하지 않는다.** 이건 선택이 아니라 의무다.

안내할 때 **불일치 확신도를 5점 척도로 평가**해 함께 제시한다(사용자가 "지금 고칠지 무시할지" 빨리 판단하도록):

| 점수 | 기준 |
|:---:|---|
| 5/5 | FRD가 명시한 수치·enum·상태조건·API계약과 구현이 **정면으로 다름** (예: 1h vs 3h, WAITING만 vs WAITING+진행중) |
| 4/5 | FRD 문구와 구현이 어긋나며, 다르게 해석할 여지가 거의 없음 |
| 3/5 | 규칙 해석이 갈릴 수 있으나 구현이 FRD 문구에서 벗어나 보임 |
| 2/5 | FRD가 부분적으로만 다루거나 해석 여지가 큼 — 확인 차원 |
| 1/5 | FRD가 침묵하는 영역 — 참고용 환기 |

**안내 포맷 예시:**

```text
⚠️ 스펙-구현 불일치 감지 (확신도 5/5)
- FRD: session-settings-editable.md S1 — "설정 수정은 WAITING일 때만"
- 지금 구현/논의: WAITING·IN_PROGRESS 둘 다 허용
- 출처: (카톡 논의로 추정 / 대화 중 결정 등 파악되면 명기)
→ 어느 쪽이 맞습니까? 구현/새 결정이 맞다면 `/sync-frd`로 FRD·decision을 최신화하세요.
```

확정 시 `/sync-frd`(요구사항 재정의 없이 확정된 변경만 FRD·`docs/decisions/`에 반영). 감지되고도 사용자가 잊어 묻히지 않도록, 착수 시 구현 노트의 **`## FRD 핵심 값` 표**에 FRD 수치·규칙을 옮겨 적어 대조 기준을 남기고(`docs/product/features/README.md` 템플릿), PR 직전 체크리스트에서 그 표 대비 일치를 재확인한다.
