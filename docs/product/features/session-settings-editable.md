# 세션 설정 편집 (목표킬·제한시간)

- FRD: ../../specs/frd/session-settings-editable.md
  ⚠️ 정확한 파일명·URL은 허브에서 확인 후 확정
- 참조 시점: 2026-07-28 / 허브 커밋 `<sha 7자리 확인 필요>` / status: **review**
  (README 규칙 #2 "approved만 착수" 예외 — FRD가 "신규 개발 항목, 구현 후 approved 전환" 명시, 담당자 본인 진행)
- 구현 상태: 진행 중
- 관련 PRD: [session-auto-end.md](session-auto-end.md), [session-deletion.md](session-deletion.md)

---

## 문제 정의

방을 만든 뒤 목표킬·제한시간을 바꿀 수단이 없다. 시작 전 오설정을 바로잡거나, 게임 중 합의된 규칙 변경을 반영할 수 없다.

## 해결책

Host가 WAITING·진행중 상태에서 목표킬·제한시간을 편집한다. 이미 확정된 매치 점수는 소급 변경되지 않고, 편집 이후 확정되는 매치부터 새 값이 적용된다.

## 사용자 스토리

1. Host로서, WAITING 세션의 목표킬·제한시간을 수정하고 싶다, 시작 전 오설정을 바로잡기 위해서다.
2. Host로서, 진행중 세션의 목표킬·제한시간을 수정하고 싶다, 게임 도중 합의된 규칙 변경을 반영하기 위해서다.
3. Host로서, 설정을 수정해도 이미 확정된 매치의 점수는 그대로 유지되길 원한다, 과거 결과가 소급 변경되지 않아야 하기 때문이다.
4. Host로서, 진행중이라도 제한시간을 제거(무제한)할 수 있길 원한다, 상황에 따라 시간 제약을 풀어야 할 수 있기 때문이다.
5. Host가 아닌 사용자로서, 설정 수정 시도가 거부(403)되길 기대한다, 방 규칙은 Host만 바꿔야 하기 때문이다.
6. 사용자로서, 종료된 세션에서의 설정 수정이 거부(400)되길 기대한다, 끝난 세션은 변경 대상이 아니기 때문이다.
7. 사용자로서, 목표킬 1 미만·제한시간 1분 미만으로의 수정이 거부(400)되길 기대한다, 생성 시 검증과 동일해야 하기 때문이다.

## 구현 결정사항

- **`Session`(entity)**: `updateSettings(targetKills, timeLimitMinutes)` 도메인 메서드 추가. 생성자 전용이던 검증 로직을 편집에서도 재사용하도록 추출. 편집 허용 상태(WAITING·IN_PROGRESS) 판단은 도메인 책임(Tell, Don't Ask).
- **`SessionService`**: `updateSettings`(Host·상태 검증 후 엔티티에 위임). 목표킬 하향 시 즉시 kill-limit 재판정은 하지 않는다 — 다음 매치 확정 시점에 판정(편집의 "이후 매치부터" 원칙과 일관).
- **`SessionController`**: `PATCH /api/sessions/{sessionId}/settings`. 요청 DTO는 `record`. `timeLimitMinutes: null` 허용(제한시간 제거).
- **API 계약**: body `{ targetKills?, timeLimitMinutes? }`. Host·(WAITING|IN_PROGRESS)만. 성공 200.
- **제한시간 변경과 만료 처리**: 만료 종료는 폴링 배치(→ [session-auto-end.md](session-auto-end.md))가 매분 현재 `timeLimitMinutes`를 재평가하므로, 편집 시 타이머 재등록이 불필요하다. 이 PRD는 값 편집만 책임진다.

**소급 적용 없음의 근거** (프로토타입 검증 결과, 별도 코드 불필요)
- `Match.confirm()`이 확정 시점에 점수를 Match 컬럼(`matchBonusScore`/`matchPenaltyScore`/`matchKillCount`)에 기록하고 Team 누적기에 더한다. 이후 설정 변경은 과거 확정 매치를 재계산하지 않는다 → "편집 이전 매치는 기존 값, 이후 매치는 새 값"이 현재 설계로 자동 성립.

## 테스트 결정사항

- **좋은 테스트 = 외부 동작만 검증**. "검증 로직 재사용" 같은 구현이 아니라 "Host가 진행중에 목표킬을 바꾸면 반영된다", "비-Host는 403"처럼 관찰 가능한 결과를 테스트한다.
- **인수(HTTP seam)**: 기존 `SessionAcceptanceTest`(Cucumber) 재사용 — 가장 높은 seam. Host 편집 성공, 비-Host 403, 종료세션 편집 400, 최소값 미만 400.
- **도메인 단위**: `Session.updateSettings` 검증(1 미만/1분 미만 예외), 상태별 편집 허용/거부. Mock 불필요.
- **테스트 선례**: `MatchTest`(도메인 단위), `SessionAcceptanceTest`(인수), `SessionFixture`.

## 범위 외

- **룰 타입/값 편집**(킬당 점수, 패널티 등) — 이번은 목표킬·제한시간만. 룰 값 편집은 기존 `updateRule`에 남김(tech-debt 기록됨).
- 만료 종료 신뢰성 개선(폴링 전환) — [session-auto-end.md](session-auto-end.md) 범위.

## 추가 참고사항

- **FRD 개정 필요분**(허브): S1 "WAITING만" → **"WAITING+진행중"**.
- **충돌 위험**: `Session.java`·`SessionService`가 hot 파일(직전 team-survival-penalty 머지 #93). 작업 전 main 최신화 권장.