# docs 구조

기획(아이디에이션 → 회의 → 결정 → 스펙)과 개발 문서가 **모두 이 레포에** 있다.
2026-08-03 허브(mechuri-docs)에서 기획 문서를 이관했다 — 배경은 [2026-08-03 결정](https://github.com/everyware-ie/mechuri-docs/blob/main/team/decisions/2026-08-03-ideation-pipeline-location.md).

```
docs/
│  ── 기획 파이프라인 (2026-08-03 허브에서 이관) ──
├── ideation/<닉네임>/      # 개인 아이디어 원문 (raw, 불변 — 고쳐 쓰지 않고 새 노트로 보완)
├── meetings/<YYYY-MM-DD>/ # 회의 종합 (synthesis.md)
├── decisions/             # 의사결정 (index.md 포함, decided 이후 변경은 "개정" append)
├── specs/
│   ├── frd/               # 기능정의서 — 구현 근거 (approved만 유효)
│   └── prd/               # 제품 요구 문서
├── topics/                # 주제별 종합
├── ops/                   # 운영 (어드민·도구·거버넌스)
├── marketing/
│
│  ── 개발 문서 ──
├── architecture/
│   ├── erd/               # ERD (current.mermaid, v1.mermaid)
│   └── adr/               # 아키텍처 결정 기록
├── backend/
│   ├── conventions.md     # 코딩 컨벤션 (네이밍, SOLID, null 처리 등)
│   ├── architecture.md    # 아키텍처 규칙 + 예외 처리
│   ├── layers.md          # 레이어별 지침 (Controller / Service / Repository / Domain)
│   └── tests.md           # 테스트 전략 + 유형별 지침
├── frontend/
│   └── conventions.md     # 코딩 컨벤션 (API 레이어, 상태 관리, 스타일 등)
├── product/
│   └── features/          # 기능별 구현 노트 (FRD 원문 아님 — specs/frd/ 참조)
├── team/
│   └── workflow.md        # 개발 워크플로우
└── common/
    ├── docs-convention.md  # 문서화 트리거 가이드
    ├── tech-debt.md        # 기술 부채 & PR 변경 이력
    ├── retrospect/         # 스프린트 회고
    └── law/                # 소프트웨어 공학 원칙
```

## 탐색 가이드

| 궁금한 내용 | 참고 문서 |
|------------|----------|
| **기능 명세 (FRD) — 구현 근거** | `specs/frd/` |
| **제품 요구 문서 (PRD)** | `specs/prd/` |
| **기능별 구현 노트** | `product/features/` |
| **지금까지의 결정** | `decisions/index.md` |
| **회의 기록** | `meetings/` |
| **주제별 논의 종합** | `topics/` |
| **아이디어 원문 쌓기** | `ideation/<본인 닉네임>/` (`idea/<닉네임>` 브랜치에서) |
| 운영 (어드민·도구) | `ops/` |
| 백엔드 코딩 규칙 | `backend/conventions.md` |
| 레이어별 구현 지침 | `backend/layers.md` |
| 테스트 전략 | `backend/tests.md` |
| 아키텍처 규칙 / 예외 처리 | `backend/architecture.md` |
| 프론트엔드 코딩 규칙 | `frontend/conventions.md` |
| 현재 ERD | `architecture/erd/current.mermaid` |
| 아키텍처 결정 기록 | `architecture/adr/` |
| 기술 부채 현황 | `common/tech-debt.md` |
| 언제 문서를 업데이트하나 | `common/docs-convention.md` |

## 허브(mechuri-docs)와의 관계

기획 문서의 정본은 이제 이 레포다. 허브에는 다음만 남는다:

- **제품 대장** — 어느 제품이 어느 repo인지(순회 시작점)
- **팀 공통** — 프로세스 결정, 컨벤션, 템플릿
- **통합 회의 기록** — 여러 제품이 함께 논의된 전체 회의
- 노션 이관 아카이브 등 불변 원자료

## 아이디에이션 규약

- 브랜치: **`idea/<닉네임>`** — 개인 상시 브랜치, 머지 후에도 삭제하지 않고 재사용
- 경로: **`docs/ideation/<본인 닉네임>/`** — 본인 폴더에만 쓴다. 타인의 raw는 읽기 전용
- raw는 **불변** — 완료한 원문은 고쳐 쓰지 않고 새 노트로 보완한다
