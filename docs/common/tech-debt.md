# 기술 부채 & PR 변경 이력

발견한 기술 부채와 주요 PR 변경 이력을 기록한다.

---

## 기술 부채

### 세션 나가기(leave) API 미구현

- **발견 경위**: [이슈 #111](https://github.com/everyware-ie/kill-betting/issues/111) "내 세션 목록에 Leader 지정 세션 포함" 작업 중 조사.
- **현황**: `SessionUser.leave()` 엔티티 메서드와 `SessionUserRepository.deleteBySession_IdAndUser_Id`가 정의돼 있으나, 운영 코드(Controller/Service) 어디에서도 호출되지 않는다. 테스트 코드에서만 직접 호출됨.
- **영향**: 세션 이탈이라는 개념이 실제로는 동작하지 않는다. `SessionParticipantRegistry`의 WebSocket 연결 해제 처리는 인메모리 참가자 목록만 갱신할 뿐 DB `SessionUser.status`나 `Team.leader`에는 영향을 주지 않는다.
- **후속 조치**: 이탈 플로우가 필요해지면 `/feature-start`로 별도 기능 정의 후 진행.

### 룰 수정 API가 value 변경만 지원 (룰 생성/삭제·타입 전환 불가)

- **위치**: `PUT /sessions/{id}/rules/{ruleId}` (`SessionService.updateRule`), FE `RoomAPI.updateRule`
- **내용**: 룰 수정 API는 기존 Rule의 `value`만 변경한다. 세션 생성 후 생존 패널티 방식을
  전환(`SURVIVAL_PENALTY` ↔ `TEAM_SURVIVAL_PENALTY`)하려면 기존 룰 삭제 + 새 룰 생성이 필요하지만
  현재 엔드포인트로는 불가능하다. 또한 `Rule.updateValue`는 `value >= 1`만 허용하므로 룰을 "끄기"(0) 요청은 실패한다.
- **영향**: 방식 전환은 **세션 생성 시점**에만 완전히 지원된다. 생성 후 편집은 활성화된 방식의 value 조정만 가능.
- **해결 방향**: 룰 컬렉션을 통째로 교체하는 `PUT /sessions/{id}/rules` (rules 배열 전체 replace) 또는
  룰 활성/비활성 토글 엔드포인트 도입.

### 로컬 `ddl-auto: update`가 운영 스키마 드리프트를 가림 (해결됨)

- **발견 경위**: 머지 후 EC2 배포 액션은 성공으로 뜨는데 `docker ps`엔 backend가 안 보이고, job을 재실행하면 뜨는 현상 조사. `docker logs`에서 `Schema-validation: missing table [favorite_nicknames]`로 부팅 자체가 실패하고 있었음 (`restart: on-failure:3` 소진 후 컨테이너가 조용히 Exited로 멈춤 → 배포 액션은 이미 성공 처리된 뒤라 겉으론 성공으로 보임).
- **원인**: 이 프로젝트엔 스키마 마이그레이션 도구가 없었고, 로컬은 `ddl-auto: update`로 Hibernate가 새 엔티티/컬럼을 알아서 만들어줘서 문제를 못 느꼈지만, 운영은 `ddl-auto: validate`라 테이블이 미리 없으면 부팅이 막힘. 엔티티와 운영 DB(mysqldump로 실제 스키마 확인)를 전수 대조한 결과 `favorite_nicknames`(PR #109) 테이블 누락 외에 `hidden_sessions` 테이블 누락, `rules.rule_type` enum에 `TEAM_SURVIVAL_PENALTY`(PR #93, 2026-07-21) 미반영도 함께 발견— 후자는 부팅은 통과하지만 해당 룰 타입 저장 시 런타임에서 조용히 실패하는 상태였음.
- **조치**: Flyway 도입 (`jieung/chore/flyway-migration-setup`). 운영 DB의 현재 상태를 `V1__baseline.sql`로 baseline 처리하고, 누락분을 `V2`(favorite_nicknames) · `V3`(rule_type enum 확장) · `V4`(hidden_sessions)로 순서대로 적용. 로컬 개발 환경도 `ddl-auto: validate` + Flyway로 통일해 앞으로 같은 종류의 드리프트가 재발하지 않도록 함 (엔티티 변경 시 마이그레이션 파일 작성이 강제됨).

---

## PR 변경 이력

### TEAM_SURVIVAL_PENALTY 룰 추가 (2026-07-21)

- `RuleType.TEAM_SURVIVAL_PENALTY` 추가: TOP10 실패자가 1명이라도 있으면 팀 전체 -value 1회 감점
- 기존 `SURVIVAL_PENALTY`(인당 감점)와 **택일** — `SessionService.createSession`에서 동시 등록 시 400 검증
- FE: 룰 설정을 `penaltyMode`('NONE'|'PER_PLAYER'|'TEAM_ONCE') 세그먼트 선택으로 변경, 매치 등록 미리보기에 적용 패널티 표기
- glossary.md에 `SurvivalPenalty`/`TeamSurvivalPenalty` 용어 추가

### Flyway 마이그레이션 도입 (2026-07-29)

- `flyway-core` + `flyway-mysql` 의존성 추가, `db/migration/`에 `V1__baseline`(운영 DB mysqldump 기반) ~ `V4` 작성
- `spring.flyway.baseline-on-migrate=true` + `baseline-version=1`로 기존 운영/로컬 DB는 V1을 재실행하지 않고 baseline 처리, 신규(빈) DB는 V1부터 전체 적용
- local/prod 공통 `ddl-auto: validate`로 통일 (local 전용 `ddl-auto: update` 제거), test(H2)는 `spring.flyway.enabled=false`로 기존 `create-drop` 유지
- 누락돼있던 `favorite_nicknames`, `hidden_sessions` 테이블 생성 및 `rules.rule_type` enum에 `TEAM_SURVIVAL_PENALTY` 반영
