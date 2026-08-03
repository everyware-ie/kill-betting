---
title: 세션 관리 FRD
product: kill-betting
type: frd
status: approved
updated: 2026-07-15
related: [kill-betting-core]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 세션 관리 — 기능정의서 (FRD)

> 상위 PRD: [kill-betting-core](../prd/kill-betting-core.md) (`approved`). 코드 기준(2026-07-15 검증) — 이미 운영 중인 구현을 문서화한 것으로, 이 FRD 자체가 구현 근거다.

## 1. 개요

세션은 하나의 킬내기 이벤트 단위. Host가 생성하고 roomCode로 참가자를 모아 팀을 구성한 뒤 시작한다. `WAITING → IN_PROGRESS → ENDED` 상태로 진행되며, 종료 후 "이어하기(renew)"로 같은 규칙·팀 구성을 재사용해 다음 라운드를 시작할 수 있다.

## 2. 사용자 플로우

1. Host가 세션 생성(이름, 목표 킬 수 선택, 제한시간 선택) → roomCode 자동 발급(6자리 영숫자)
2. Host가 참가자 초대(roomCode 공유) → 참가자들 접속(대기석)
3. Host가 팀 생성 + 대기석 사용자를 팀에 배정 + 리더 지정 (WebSocket 실시간 반영, 팀당 최대 4명)
4. Host가 세션 시작 (최소 2팀, 팀마다 리더+최소 1명 이상 플레이어 등록 필요)
5. 진행 중: 매치 업로드/승인 반복 ([업로드](match-upload.md)/[승인](match-confirm.md) FRD), 스코어보드 실시간 갱신
6. 종료: Host 수동 종료 / 목표 킬 달성 / 제한시간 만료 중 하나로 자동·수동 종료, 승자 결정(동률 시 무승부)
7. (선택) Host가 이어하기 → 규칙·팀 구성을 복사한 새 세션 생성(리더 배정은 미복사, 참가자가 재접속해 재배정)

## 3. 화면/인터랙션 정의

| 화면 ID | 이름 | 주요 구성 | 비고 |
|---|---|---|---|
| room/create | 방 생성 | 이름, 목표킬, 제한시간 입력 | |
| room/[id]/setup | 방 설정 | roomCode 표시, 팀 구성(실시간), 규칙 설정 | `WAITING` 상태에서만 |
| room/[id]/live | 진행 화면 | 스코어보드, 매치 업로드/승인 진입, 운영 메뉴 | `IN_PROGRESS` |
| room/[id]/result | 결과 화면 | 승자, 최종 점수, 매치 히스토리, 이어하기 버튼 | `ENDED` |

## 4. 기능 규칙 (Business Rules)

| # | 규칙 | 근거 |
|---|---|---|
| B1 | roomCode는 6자리 영숫자, 세션마다 고유. 중복 시 최대 10회 재시도 후 실패 처리 | `SessionCodeGenerator` |
| B2 | 세션 이름 필수, 목표 킬 수·제한시간은 각각 1 이상(선택 입력 — null이면 해당 종료조건 없음) | `Session` 생성자 검증 |
| B3 | 팀 구성(팀 생성/플레이어 추가·수정·삭제/리더 지정)은 **Host만** 가능 — 팀 리더 본인은 자기 팀원을 바꿀 수 없음 | `TeamConfigureService.validateHost` |
| B3-개정 (2026-07-22) | ⚠️ **플레이어 추가·수정·삭제는 팀 리더에게도 위임 예정**(본인 팀 한정). 팀 생성·리더 지정은 Host 전용 유지. 상세: [team-setup-delegation.md](team-setup-delegation.md)(`review`, 구현 전) | [2026-07-22 결정](../../decisions/2026-07-22-team-setup-delegation.md) |
| B4 | 팀 구성은 세션이 `WAITING`일 때만 가능 | `TeamConfigureService.findWaitingSession` |
| B5 | 팀당 최대 4명, 닉네임은 **팀 내에서만** 고유(전역 아님) | `TeamConfigureService.addPlayer` |
| B6 | 리더는 "대기석에 있는 사용자"만 지정 가능(세션 참가는 했지만 아직 리더 아닌 사람), Host 본인은 예외적으로 가능. 한 사용자는 세션 내 한 팀의 리더만 될 수 있음 | `TeamConfigureService.assignLeader` |
| B7 | 세션 시작 조건: 최소 2팀, 팀마다 리더 배정 필수, 팀마다 최소 1명 이상 플레이어(닉네임) 등록 필수. 참가자 전원이 접속해 있을 필요는 없음 | `SessionService.startSession` |
| B8 | 세션 종료 사유 3종: `HOST_TERMINATED`(Host 수동), `KILL_LIMIT_REACHED`(목표 킬 달성 시 자동, [승인 FRD](match-confirm.md) C7), `TIME_EXPIRED`(제한시간 만료) | `SessionEndService` |
| B9 | 승자 결정: 팀 유효 점수(킬+룰점수+보정점수) 최댓값 팀. 동률이면 승자 없음(무승부) | `SessionEndService.determineWinner` |
| B10 | 이어하기(renew): **종료된 세션의 Host만** 가능. 규칙·팀·팀원 닉네임을 복사해 새 세션(새 roomCode) 생성. **리더 배정은 복사하지 않음**(재접속 후 재배정 필요 — 미접속 사용자가 이미 참여 중인 것처럼 보이는 걸 막기 위함). 세션 이름은 "N라운드"로 자동 증가. 이미 이어하기 세션이 있으면 재생성하지 않고 기존 것을 반환 | `SessionRenewService` |

## 5. 예외 처리

| 상황 | 처리 | 근거 |
|---|---|---|
| Host 아닌 사용자가 시작/종료/팀구성/이어하기 시도 | 403 forbidden | 각 서비스 권한 체크 |
| 리더 없는 팀 또는 팀원 없는 팀으로 시작 시도 | 400, "OO팀에 리더가 배정되지 않았습니다" / "닉네임이 등록되지 않았습니다" | `startSession` |
| 이미 다른 팀 리더인 사용자를 리더로 재지정 | 400 | `assignLeader` |
| 대기석에 없는 사용자를 리더로 지정 | 400 | `assignLeader` |
| 진행중 아닌 세션을 종료 시도 | 400 | `endByHost` |
| 종료 안 된 세션 renew 시도 | 400 | `SessionRenewService` |
| WAITING 아닌 세션에서 팀 구성 시도 | 400 | `TeamConfigureService` |

## 6. 데이터 (엔티티/필드 수준)

- **Session**: id, name, roomCode(unique), host, status(`WAITING`/`IN_PROGRESS`/`ENDED`), targetKills?, timeLimitMinutes?, currentRuleSet, winnerTeam?, renewedSessionId?, startedAt?, endedAt?
- **Team**: id, session, name, leader?, totalKills, ruleScore, adjustmentScore (→ `effectiveKills` = 세 값의 합), players[]
- **TeamPlayer**: id, team, playerNickname(팀 내 고유), totalKills, bonusKills, penaltyKills (→ effectiveKills)
- **RuleSet / Rule**: 세션당 현재 RuleSet 1개. Rule = ruleType(`CHICKEN_BONUS`/`SURVIVAL_PENALTY`) + operator + value + enabled

## 7. 비기능 요구 / 정책 연계

- 실시간 갱신: 팀 구성은 WebSocket(STOMP, `/topic/sessions/{id}`)으로 즉시 반영. 세션 시작/종료/이어하기 이벤트도 같은 토픽으로 브로드캐스트
- 세션 종료(사유별)·시작·이어하기마다 메트릭 카운터 기록(`session.ended{reason}`, `session.renewed` 등)

## 8. 구현 노트 링크

kill-betting `docs/product/features/session.md` (스텁, 필요 시 생성)
