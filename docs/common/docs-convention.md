# 문서화 컨벤션

코드 변경과 문서 변경은 같은 PR에 포함한다. 문서 없는 변경은 완료로 간주하지 않는다.

---

## 백엔드

| 변경 | 업데이트할 문서 |
|------|----------------|
| 신규 API 추가 / 변경 / 삭제 | `docs/product/features/` 해당 FRD |
| `ErrorCode` 추가 / 변경 | `docs/backend/architecture.md` 예외 처리 섹션 |
| ERD 변경 (테이블 / 컬럼) | `docs/architecture/erd/current.mermaid` |
| 도메인 용어 추가 / 변경 | `.claude/domain/glossary.md` |
| 아키텍처 결정 변경 | `docs/architecture/adr/` 새 ADR 작성 |
| 기술 부채 발견 | `docs/common/tech-debt.md` |

---

## 프론트엔드

| 변경 | 업데이트할 문서 |
|------|----------------|
| `lib/[domain]-api.js` 에 신규 API 함수 추가 | Mock 분기 함께 작성 (코드가 곧 문서) |
| 세션 상태값 추가 / 변경 | `docs/frontend/conventions.md` 세션 상태값 섹션 |
| CSS 변수 추가 | `docs/frontend/conventions.md` CSS 변수 테이블 |
