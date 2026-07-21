# 기술 부채 & PR 변경 이력

발견한 기술 부채와 주요 PR 변경 이력을 기록한다.

---

## 기술 부채

### 룰 수정 API가 value 변경만 지원 (룰 생성/삭제·타입 전환 불가)

- **위치**: `PUT /sessions/{id}/rules/{ruleId}` (`SessionService.updateRule`), FE `RoomAPI.updateRule`
- **내용**: 룰 수정 API는 기존 Rule의 `value`만 변경한다. 세션 생성 후 생존 패널티 방식을
  전환(`SURVIVAL_PENALTY` ↔ `TEAM_SURVIVAL_PENALTY`)하려면 기존 룰 삭제 + 새 룰 생성이 필요하지만
  현재 엔드포인트로는 불가능하다. 또한 `Rule.updateValue`는 `value >= 1`만 허용하므로 룰을 "끄기"(0) 요청은 실패한다.
- **영향**: 방식 전환은 **세션 생성 시점**에만 완전히 지원된다. 생성 후 편집은 활성화된 방식의 value 조정만 가능.
- **해결 방향**: 룰 컬렉션을 통째로 교체하는 `PUT /sessions/{id}/rules` (rules 배열 전체 replace) 또는
  룰 활성/비활성 토글 엔드포인트 도입.

---

## PR 변경 이력

### TEAM_SURVIVAL_PENALTY 룰 추가 (2026-07-21)

- `RuleType.TEAM_SURVIVAL_PENALTY` 추가: TOP10 실패자가 1명이라도 있으면 팀 전체 -value 1회 감점
- 기존 `SURVIVAL_PENALTY`(인당 감점)와 **택일** — `SessionService.createSession`에서 동시 등록 시 400 검증
- FE: 룰 설정을 `penaltyMode`('NONE'|'PER_PLAYER'|'TEAM_ONCE') 세그먼트 선택으로 변경, 매치 등록 미리보기에 적용 패널티 표기
- glossary.md에 `SurvivalPenalty`/`TeamSurvivalPenalty` 용어 추가