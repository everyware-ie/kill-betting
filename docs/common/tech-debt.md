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

### `matches.status` DB enum에 `DELETED` 값 누락 (해결됨)

- **발견 경위**: 매치 삭제(`DELETE /api/matches/{id}`) 요청이 500으로 실패, 로그에서
  `Data truncated for column 'status' at row 1` 확인.
- **원인**: `MatchStatus`(Java enum)는 `PENDING, CONFIRMED, DELETED` 세 값을 갖지만, `matches.status`
  DB 컬럼은 `V1__baseline.sql`부터 `enum('CONFIRMED','PENDING')`으로만 정의돼 있었다. `V6__create_match_deletion_logs.sql`이
  매치 소프트삭제(삭제 로그 테이블) 기능을 추가하면서 `MatchDeleteService`가 `status`를 `DELETED`로
  갱신하도록 했는데, DB enum 컬럼을 넓히는 걸 빠뜨려 `rule_type`(V3) 때와 같은 유형의 스키마 드리프트가 재발했다.
- **영향**: 매치 삭제 기능이 운영에서 항상 500으로 실패.
- **조치**: `V7__widen_match_status_enum.sql` 추가 — `matches.status`를
  `enum('CONFIRMED','PENDING','DELETED')`로 확장.

### deploy.yml의 backend/frontend/infra 배포 job이 EC2에 동시 접속 (해결됨)

- **발견 경위**: 배포 장애(스키마 드리프트로 인한 부팅 크래시, 별도 기록) 조사 중 `deploy.yml` 구조를 보다가 발견.
- **원인**: `deploy-backend` / `deploy-frontend` / `deploy-infra`가 서로 독립된 job이라 같은 커밋에 backend/frontend가 둘 다 바뀌면 (혹은 infra 경로까지 겹치면) 두 개 이상의 job이 동시에 같은 EC2 호스트에 SSH로 붙어 `docker compose up -d`를 실행한다. 셋 다 `prometheus`, `loki`, `grafana`, `killnagi-net` 네트워크를 공통으로 건드리기 때문에, 동시 실행 시 같은 컨테이너를 서로 재생성하려고 경쟁하거나 네트워크 생성이 겹칠 수 있다.
- **영향**: 배포가 간헐적으로 실패(또는 일부만 반영)할 수 있는 잠재 위험. 이번 스키마 드리프트 사고의 직접 원인은 아니었지만, 같은 "액션은 성공, 실제 배포 상태는 불확실" 계열의 증상을 만들 수 있는 별개의 버그.
- **조치**: `deploy-backend` / `deploy-frontend` / `deploy-infra` job에 동일한 `concurrency.group: deploy-ec2`를 부여해 세 job이 절대 동시에 EC2에 붙지 않도록 직렬화 (`cancel-in-progress: false`로 취소 대신 대기).

### 배포 스크립트의 `docker image prune -f`가 커밋 SHA 태그 이미지를 못 지움 (해결됨)

- **발견 경위**: Grafana 접속 시 "failed to load its application files" 에러 조사 중 `df -h` 결과 EC2 루트 디스크(29G)가 100% 사용 중임을 발견. `docker system df -v`로 원인 추적.
- **원인**: `deploy.yml`의 빌드 스텝이 이미지에 태그를 두 개 붙임 — `latest`(배포마다 재사용됨)와 커밋 SHA(`github.sha`, 배포마다 유일함). `docker image prune -f`(옵션 `-a` 없음)는 태그를 잃은 dangling 이미지만 지우는데, SHA 태그는 한 번도 재사용되지 않으므로 dangling이 될 일이 없어 배포할 때마다 새 이미지가 태그된 채로 무기한 쌓였음. backend 이미지 하나가 ~600MB, frontend ~240MB씩 수개월치가 누적되어 디스크를 채움.
- **영향**: Grafana의 내부 SQLite가 디스크 풀(SQLITE_FULL, errno 13)로 쓰기 실패 → "application files 로드 실패" 화면. 같은 디스크를 쓰는 backend/frontend 컨테이너도 잠재적으로 영향권.
- **조치**: 세 배포 job의 정리 스텝을 `docker image prune -f` → `docker image prune -a -f --filter "until=720h"`로 변경. `-a`로 dangling 여부와 무관하게 미사용 이미지를 대상에 포함시키되, `until=720h`(30일) 필터로 최근 한 달 이내 이미지는 롤백 대비용으로 보존하고 그보다 오래된 것만 정리. 현재 실행 중인 컨테이너가 쓰는 이미지는 `-a` 옵션에서도 항상 보존됨.
- **후속**: EC2에 이미 쌓인 기존 이미지·3.75GB build cache·미사용 `mysql:8.0`(로컬 개발 초기 잔재, 현재는 RDS 사용)은 수동 정리 필요 (`docker image prune -a -f`, `docker builder prune -a -f`로 1회성 정리 진행).

### 로컬 `ddl-auto: update`가 운영 스키마 드리프트를 가림 (해결됨)

- **발견 경위**: 머지 후 EC2 배포 액션은 성공으로 뜨는데 `docker ps`엔 backend가 안 보이고, job을 재실행하면 뜨는 현상 조사. `docker logs`에서 `Schema-validation: missing table [favorite_nicknames]`로 부팅 자체가 실패하고 있었음 (`restart: on-failure:3` 소진 후 컨테이너가 조용히 Exited로 멈춤 → 배포 액션은 이미 성공 처리된 뒤라 겉으론 성공으로 보임).
- **원인**: 이 프로젝트엔 스키마 마이그레이션 도구가 없었고, 로컬은 `ddl-auto: update`로 Hibernate가 새 엔티티/컬럼을 알아서 만들어줘서 문제를 못 느꼈지만, 운영은 `ddl-auto: validate`라 테이블이 미리 없으면 부팅이 막힘. 엔티티와 운영 DB(mysqldump로 실제 스키마 확인)를 전수 대조한 결과 `favorite_nicknames`(PR #109) 테이블 누락 외에 `hidden_sessions` 테이블 누락, `rules.rule_type` enum에 `TEAM_SURVIVAL_PENALTY`(PR #93, 2026-07-21) 미반영도 함께 발견— 후자는 부팅은 통과하지만 해당 룰 타입 저장 시 런타임에서 조용히 실패하는 상태였음.
- **조치**: Flyway 도입 (`jieung/chore/flyway-migration-setup`). 운영 DB의 현재 상태를 `V1__baseline.sql`로 baseline 처리하고, 누락분을 `V2`(favorite_nicknames) · `V3`(rule_type enum 확장) · `V4`(hidden_sessions)로 순서대로 적용. 로컬 개발 환경도 `ddl-auto: validate` + Flyway로 통일해 앞으로 같은 종류의 드리프트가 재발하지 않도록 함 (엔티티 변경 시 마이그레이션 파일 작성이 강제됨).
- **후속 발견 1**: Flyway 도입 직후 운영 재배포에서 `Circular depends-on relationship between 'flyway' and 'entityManagerFactory'`로 또 부팅 크래시. 원인은 `spring.jpa.defer-datasource-initialization: true`(Hibernate ddl-auto가 스키마를 만들던 시절, data.sql을 그 뒤에 실행시키기 위한 설정)가 Flyway와 함께 있으면 순환 의존이 생기는 Spring Boot의 알려진 제약. 이제 스키마는 Flyway가 만들고 Hibernate는 validate만 하므로 이 설정 자체가 불필요해져 제거.
- **후속 발견 2**: 위 수정 후 실제 MySQL 컨테이너에 앱을 직접 부팅시켜 재검증하는 과정(H2 테스트는 Flyway를 꺼놔서 이 클래스의 문제를 못 잡음)에서 `sessions` 테이블에 `last_match_at`(InactivityTimeout), `deleted_at`(SoftDelete) 컬럼도 운영에 없는 것을 추가로 발견 — 테이블 유무만 대조하고 컬럼 단위까지 안 본 게 원인. 전체 11개 엔티티를 컬럼 단위로 재대조해 이 두 개 외엔 드리프트 없음을 확인했고, `V5`로 추가.
- **검증**: 임시 MySQL 8 컨테이너에 빈 스키마 상태로 `./gradlew bootRun --spring.profiles.active=prod`를 직접 실행해 `V1~V5` 마이그레이션 + JPA 검증 + Spring Security까지 전부 통과하고 `Started KillnagiApplication`까지 확인.

---

## PR 변경 이력

### TEAM_SURVIVAL_PENALTY 룰 추가 (2026-07-21)

- `RuleType.TEAM_SURVIVAL_PENALTY` 추가: TOP10 실패자가 1명이라도 있으면 팀 전체 -value 1회 감점
- 기존 `SURVIVAL_PENALTY`(인당 감점)와 **택일** — `SessionService.createSession`에서 동시 등록 시 400 검증
- FE: 룰 설정을 `penaltyMode`('NONE'|'PER_PLAYER'|'TEAM_ONCE') 세그먼트 선택으로 변경, 매치 등록 미리보기에 적용 패널티 표기
- glossary.md에 `SurvivalPenalty`/`TeamSurvivalPenalty` 용어 추가

### EC2 배포 job 동시 실행 방지 (2026-07-29)

- `deploy-backend` / `deploy-frontend` / `deploy-infra`에 공통 `concurrency: group: deploy-ec2, cancel-in-progress: false` 추가
- 세 job이 공유하는 EC2 호스트에 동시에 `docker compose up -d`를 실행하지 못하도록 직렬화

### EC2 배포 이미지 정리 정책 도입 (2026-08-04)

- 세 배포 job의 `docker image prune -f` → `docker image prune -a -f --filter "until=720h"`로 변경
- 커밋 SHA로 태그된 이미지는 dangling이 되지 않아 무기한 쌓이던 문제 수정 — 30일(720h) 지난 미사용 이미지만 정리, 최근 이미지는 롤백 대비용으로 보존
- 현재 실행 중인 컨테이너가 참조하는 이미지는 기간과 무관하게 항상 보존됨
### Flyway 마이그레이션 도입 (2026-07-29)

- `flyway-core` + `flyway-mysql` 의존성 추가, `db/migration/`에 `V1__baseline`(운영 DB mysqldump 기반) ~ `V5` 작성
- `spring.flyway.baseline-on-migrate=true` + `baseline-version=1`로 기존 운영/로컬 DB는 V1을 재실행하지 않고 baseline 처리, 신규(빈) DB는 V1부터 전체 적용
- local/prod 공통 `ddl-auto: validate`로 통일 (local 전용 `ddl-auto: update` 제거), test(H2)는 `spring.flyway.enabled=false`로 기존 `create-drop` 유지
- `spring.jpa.defer-datasource-initialization: true` 제거 (Flyway와 결합 시 순환 의존 발생, 더 이상 필요 없는 설정)
- 누락돼있던 `favorite_nicknames`, `hidden_sessions`, `sessions.last_match_at`, `sessions.deleted_at` 반영 및 `rules.rule_type` enum에 `TEAM_SURVIVAL_PENALTY` 반영
- 임시 MySQL 컨테이너에 빈 스키마로 실제 부팅시켜 `V1~V5` + JPA + Security까지 정상 기동 검증

### TEAM_SURVIVAL_PENALTY 발동 조건 정정 (2026-08-06)

- 2026-07-21 PR #93 도입 당시 "TOP10 실패자가 1명이라도 있으면 -1회"로 문서화·구현됐던 것이 실제 의도(팀원 전원 실패해야 -1회)와 반대였음을 담당자가 확인
- `Rule.calculateScore`: `TEAM_SURVIVAL_PENALTY` 조건을 `failedTop10Count > 0` → 팀원 전원이 TOP10 실패(`allTeamMembersFailedTop10`)로 변경. `Match`에서 `matchResults` 전원의 top10 실패 여부를 계산해 전달
- FE 확정 모달: `penaltyMode === 'TEAM_ONCE'`일 때 팀원별 개별 토글 대신 치킨 보너스와 동일한 팀 단위 토글 1개로 입력 단순화 (`frontend/app/room/[id]/live/page.js`)
- `.claude/domain/glossary.md`·`docs/specs/frd/match-confirm.md`(C6 개정)도 함께 정정 — 상세: [decision](../decisions/2026-08-06-team-survival-penalty-condition-fix.md)
