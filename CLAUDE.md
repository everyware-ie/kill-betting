# CLAUDE.md

## 서비스 개요
배틀그라운드 킬내기 세션 점수 자동 계산 서비스.
팀들이 매치 결과 이미지를 업로드하면 세션 룰에 따라 점수를 자동 집계한다.

## 기획 문서의 상류 (mechuri-docs)

기능의 **무엇·왜**(정책·기능정의·요구사항)는 팀 문서 허브 [mechuri-docs](https://github.com/everyware-ie/mechuri-docs)의 `products/kill-betting/specs/`가 유일한 진실이다.

- 이 레포의 `docs/product/features/`는 허브 **approved FRD의 스텁**(링크 + 구현 노트)만 담는다. 규칙 원문을 여기에 복사하지 않는다.
- 구현 중 스텁과 허브 FRD가 어긋난 것을 발견하면 **허브가 우선** — 즉시 이슈를 만들고 진행 여부를 확인한다.
- approved 아닌(draft/review) FRD는 구현 근거가 아니다.

### 강제 게이트 (훅으로 자동 적용)

approved FRD라도 착수 전 확인 단계를 건너뛰지 못하도록 두 지점에서 훅이 강제한다:

1. **구현 착수 시점** (`pre-implementation-frd-check.sh`): 구현 메인 소스(`backend/src/main`·`frontend/{app,components,features,lib}`)를 편집할 때, **이 브랜치에** 확인 스텁(`docs/product/features/<기능>.md`, 허브 FRD 링크 포함)이 하나도 없으면 편집이 차단된다. 테스트 파일(`*.test.js`·`*.spec.js`·`backend/src/test`)은 대상 아님(TDD test-first 허용), 브랜치 타입 `chore`·`docs`는 면제. 스텁을 만들려면 허브 FRD를 가져와 사용자에게 보여주고 확인받는 단계를 거쳐야 한다. **"바로 진행"으로도 이 단계는 건너뛸 수 없다.**
2. **PR 생성 시점** (`pre-pr-checklist.sh`): PR이 참조하는 허브 FRD(본문·`--body-file`·이 브랜치의 스텁 링크에서 수집)의 `status`가 `approved`가 아니면 PR 생성이 차단된다.

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
| 기능 명세 확인 (FRD) | @docs/product/features/                  |
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
PRD는 `docs/product/features/`에 저장한다.

### AI 구현 가이드

코드 작성 전:
- 해당 기능의 PRD 확인 (`docs/product/features/`)
- `.claude/domain/glossary.md`에서 도메인 용어 확인
- `docs/architecture/adr/`에서 관련 아키텍처 결정 확인

구현 후:
- PRD 사용자 스토리를 하나씩 검토하며 구현이 일치하는지 확인
- PRD와 다르게 구현했다면 이슈 또는 새 ADR에 이유를 기록
