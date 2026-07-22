# ADR 0001: 어드민 지표 대시보드 — 접근 제어 및 지표 집계 방식

- 상태: 채택(Accepted)
- 날짜: 2026-07-22
- 관련 이슈: #94 (운영 지표 어드민 대시보드 walking skeleton)

## 배경

개발자·서비스 운영자가 서비스 지표(가입·참여·활성·리텐션)를 확인할 수 있는
읽기 전용 어드민 대시보드(`/admin`, `GET /api/admin/metrics`)를 도입한다.
두 가지 결정이 필요했다: (1) 누가 접근할 수 있는가, (2) 지표를 어떻게 산출하는가.

기존 상태:
- `User` 엔티티에 role/권한 필드가 없다.
- `SecurityConfig`는 JWT 인증만 사용하며 role 기반 접근 제어(`hasRole`)가 없다.
- 인증 principal 의 username 은 email 이 아니라 userId 다.

## 결정

### 1. 접근 제어 = 단일 어드민 이메일 (role 필드 아님)

- `ADMIN_EMAIL` 환경변수로 지정된 **단일 이메일**을 가진 유저만 접근을 허용한다.
- `AdminAccessManager`(Spring Security `AuthorizationManager`)를 `/api/admin/**` 에 적용한다.
  principal 의 userId 로 유저를 조회해 email 을 `ADMIN_EMAIL` 과 비교하고, 불일치 시 403.

**이유**: 운영자는 소수(사실상 1명 공용)이고, role 체계 도입(엔티티/마이그레이션)은
현재 규모에 과하다. 인원이 늘면 이메일 화이트리스트(복수) → role 체계로 승격한다.

**대안(기각)**: `User.role` enum 추가 — 스키마 변경·마이그레이션 비용이 이 규모에 비해 크다.

### 2. 지표 = 조회 시점 집계 (별도 분석 저장소 없음)

- 지표는 요청 시점에 각 도메인의 집계 쿼리로 계산한다. 별도 분석 테이블/배치를 두지 않는다.
- `domain/admin` 모듈(`AdminMetricsService`)은 각 도메인의 집계 결과를 **조합**만 한다.
  집계 쿼리는 소유 도메인(user/session)에 둔다.

**이유**: 데이터 규모가 작고 어드민 트래픽이 희소하다. 사전 집계·저장은 조기 최적화다.
데이터가 커져 조회가 느려지면 그때 캐시/집계 저장을 도입한다.

## 결과

- `AdminAccessManager`, `AdminMetricsService`, `AdminController`, `AdminMetricsResponse` 신규.
- `SecurityConfig` 에 `/api/admin/**` 접근 규칙 추가, `application.yml` 에 `admin.email` 추가.
- 후속 지표(성장·참여·활성·리텐션, #95/#96)는 같은 조합 방식으로 확장한다.

## 참고

- 인프라/에러 모니터링은 별도 모니터링 서버가 담당하므로 이 대시보드 범위가 아니다.
- ArchUnit 모듈 경계 테스트는 현재 미구현 상태다(문서에는 규칙이 기술돼 있으나 테스트 클래스 없음).
  향후 도입 시 `admin` 모듈의 조합 규칙을 함께 명세한다.
