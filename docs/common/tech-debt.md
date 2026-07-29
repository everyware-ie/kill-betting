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

### deploy.yml의 backend/frontend/infra 배포 job이 EC2에 동시 접속 (해결됨)

- **발견 경위**: 배포 장애(스키마 드리프트로 인한 부팅 크래시, 별도 기록) 조사 중 `deploy.yml` 구조를 보다가 발견.
- **원인**: `deploy-backend` / `deploy-frontend` / `deploy-infra`가 서로 독립된 job이라 같은 커밋에 backend/frontend가 둘 다 바뀌면 (혹은 infra 경로까지 겹치면) 두 개 이상의 job이 동시에 같은 EC2 호스트에 SSH로 붙어 `docker compose up -d`를 실행한다. 셋 다 `prometheus`, `loki`, `grafana`, `killnagi-net` 네트워크를 공통으로 건드리기 때문에, 동시 실행 시 같은 컨테이너를 서로 재생성하려고 경쟁하거나 네트워크 생성이 겹칠 수 있다.
- **영향**: 배포가 간헐적으로 실패(또는 일부만 반영)할 수 있는 잠재 위험. 이번 스키마 드리프트 사고의 직접 원인은 아니었지만, 같은 "액션은 성공, 실제 배포 상태는 불확실" 계열의 증상을 만들 수 있는 별개의 버그.
- **조치**: `deploy-backend` / `deploy-frontend` / `deploy-infra` job에 동일한 `concurrency.group: deploy-ec2`를 부여해 세 job이 절대 동시에 EC2에 붙지 않도록 직렬화 (`cancel-in-progress: false`로 취소 대신 대기).

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
