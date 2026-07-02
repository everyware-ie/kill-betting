# docs 구조

```
docs/
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
│   └── features/          # 기능 명세 (FRD)
├── team/
│   └── workflow.md        # 개발 워크플로우
└── common/
    ├── docs-convention.md  # 문서화 트리거 가이드
    ├── tech-debt.md        # 기술 부채 & PR 변경 이력
    ├── retrospect/         # 스프린트 회고
    └── law/               # 소프트웨어 공학 원칙
```

## 탐색 가이드

| 궁금한 내용 | 참고 문서 |
|------------|----------|
| 백엔드 코딩 규칙 | `backend/conventions.md` |
| 레이어별 구현 지침 | `backend/layers.md` |
| 테스트 전략 | `backend/tests.md` |
| 아키텍처 규칙 / 예외 처리 | `backend/architecture.md` |
| 프론트엔드 코딩 규칙 | `frontend/conventions.md` |
| 기능 명세 (FRD) | `product/features/` |
| 현재 ERD | `architecture/erd/current.mermaid` |
| 아키텍처 결정 기록 | `architecture/adr/` |
| 기술 부채 현황 | `common/tech-debt.md` |
| 언제 문서를 업데이트하나 | `common/docs-convention.md` |
