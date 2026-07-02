# 현재 개발 상태

> 스프린트 시작/종료 시 업데이트. Claude가 현재 맥락을 빠르게 파악하기 위한 파일.

마지막 업데이트: 2026-07-02

---

## 기능 진행 상태

### 백엔드
- [ ] 이미지 업로드 API
- [ ] OCR 파싱 파이프라인 (Vision API 연동)
- [ ] 룰 엔진 (SessionRule 기반 점수 계산)
- [x] 세션 관리 API (생성 / 조회)
- [ ] 스코어보드 집계 API
- [x] 팀 구성 API (POST/PATCH/DELETE /players, PUT /operator)
- [x] 대기석 API (SessionUser join/leave)
- [x] WebSocket 브로드캐스트 (팀 구성 변경 → /topic/sessions/{id}/configure)

### 프론트엔드
- [ ] 이미지 업로드 UI
- [ ] 세션 생성 / 참가 화면
- [x] 점수 대시보드 — features/dashboard/ 리팩토링 완료
- [x] 라이브 화면 — features/live/ 리팩토링 완료 (1077 → 332줄)
- [x] 결과 화면 — features/result/ 리팩토링 완료 (778 → 281줄)

---

## 최근 완료된 작업 (2026-07-02)

- `docs/` 전체 구조 개편 (architecture, backend, frontend, product, team, common)
- `backend/docs/SPEC/` → `docs/product/features/` 이관
- `backend/docs/ERD/` → `docs/architecture/erd/` 이관
- `.github/pull_request_template.md` 추가 (요약 + 리뷰 포커스 구조)
- `docs/team/workflow.md` — 이슈 기반 소유권 규칙
- `docs/architecture/adr/_template.md`, `docs/product/features/_template.md`
- `docs/common/tech-debt.md` — 백엔드 36건 위반 수치화 + PR 변경 이력
- `docs/frontend/conventions.md` — 현재/신규 기준 분리, 세션 상태 혼용 처리 명시
- 프론트엔드 Feature+3Layer 구조 적용: dashboard / live / result

---

## 현재 막혀있는 것 / 결정 필요한 것

- OCR 방식 확정 필요 (Vision API vs Tesseract) — NaverOcrApiClient 현재 사용 중
- `IN_PROGRESS`/`LIVE`, `ENDED`/`DONE` 세션 상태 혼용 → 백엔드 단일화 필요

---

## 기술 부채 우선순위 (상세: docs/common/tech-debt.md)

| 순위 | 대상 | 위반 수 |
|:---:|------|:------:|
| 🔴 1 | `NaverOcrApiClient.java` 리팩토링 | 458줄 / 8건 |
| 🟡 2 | 팀 상태 enum 격상 (`"READY"/"PARTIAL"/"EMPTY"`) | 3건 |
| 🟢 3 | `Session.SessionStatus` import 수정 | 5건 |