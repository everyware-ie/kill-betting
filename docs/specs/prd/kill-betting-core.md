---
title: 킬내기 코어 서비스 PRD
product: kill-betting
type: prd
status: approved
updated: 2026-07-15
related: [service-overview]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 킬내기 코어 서비스 — 요구사항 정의서 (PRD)

> **approved** — 이미 운영 서버에 배포되어 실사용 중인 **코드 구현을 최종 스펙으로 확정**했다 (2026-07-15). 노션 기획 원본과 달라진 지점은 §8에 히스토리로 남긴다.
> 근거: [service-overview](../../topics/service-overview.md), [2026-07-15 결정](../../decisions/2026-07-15-current-implementation-as-spec.md), 노션 원본 [team/archive/notion-2026-07/첫 번째 프로젝트 배그 킬내기](https://github.com/everyware-ie/mechuri-docs/tree/main/team/archive/notion-2026-07/첫%20번째%20프로젝트%20배그%20킬내기%20(이름은%20미정)/), 코드 [kill-betting](https://github.com/everyware-ie/kill-betting).

## 1. 문제 정의

배틀그라운드 유저들 사이에 자연스럽게 형성된 **킬내기 문화**는 현재 디스코드 채팅방에서 다음 방식으로 진행된다: 팀 구성 → 목표 킬 수·시간 설정 → 게임 진행 → 매치 종료 후 결과 스크린샷 업로드 → 특정 팀원이 규칙을 적용해 수동으로 킬 수 계산.

이 과정의 불편:
- 규칙 적용과 점수 계산을 사람이 직접 수행해야 함
- 현재 경쟁 상황을 한눈에 확인하기 어려움
- 매치 기록·전적이 체계적으로 저장되지 않음

*(출처: 노션 기획안 §1)*

## 2. 목표 & 성공 지표

- **서비스 목표**: 배틀그라운드 유저들이 친구들과 킬내기를 더 편리하고 몰입감 있게 즐길 수 있는 플랫폼 제공
- **MVP 목표**: 킬내기 방 생성·팀 구성·규칙 설정·매치 결과 기록·점수 자동 계산·스코어보드 제공의 시스템화 *(전적 기록은 기획안 §2.2에서 "논의 필요 → MVP 제거"로 명시됨에도 실제 User 엔티티에 totalSessions/wins/losses 필드가 구현됨 — §8-6 참고)*
- **북극성 지표**: `[미결: 아직 노션에도 수치화된 지표 없음 — 다음 회의에서 정의 필요]`. 후보: 세션 완주율(생성→FINISHED), 세션당 매치 수
- **참고 규모**: 인프라 논의 기준 DAU 8명, 저녁~새벽 시간대 트래픽 집중 예상 (초기 친구 그룹 대상 — 정식 지표는 아님)

*(출처: 노션 기획안 §2, 인프라 문서)*

## 3. 타겟 사용자

**Primary User**: 배틀그라운드를 플레이하며 친구들과 킬내기를 자주 하는 유저
- 디스코드 기반 게임 커뮤니티 활동
- 경쟁 요소 선호, 기록·통계에 관심
- 초기 사용자: 팀원(지응)의 실제 게임 친구 그룹

*(출처: 노션 기획안 §3)*

## 4. 핵심 요구사항

| # | 요구사항 | 우선순위 | 근거 |
|---|---|---|---|
| R1 | Host는 세션을 만들고 점수 규칙(SessionRule: 킬당·순위 점수)을 설정·수정할 수 있다 | M | 노션 기획안 §9·구현됨 — `POST /sessions`, `PUT rules/{ruleId}` |
| R2 | 참가자는 roomCode 하나로 세션에 참가한다 (팀/솔로 구분, 솔로=1인 팀). 로그인 사용자만 조작 가능, 비로그인은 조회(view)만 | M | FDD §1 "방 접근 권한"·구현됨 — `join/{roomCode}` |
| R3 | 세션 시작 조건: 최소 2팀, 팀마다 리더 배정 필수, 팀마다 최소 1명 이상 플레이어(닉네임) 등록 필수 — 참가자 전원 입장은 불필요 | M | FDD §2 "결정" 사항·구현 일치 확인 — `SessionService.startSession` 검증 로직 |
| R4 | 팀 리더는 매치 결과를 **이미지 업로드**로 제출하고, 시스템이 OCR로 파싱해 MatchResult를 만든다 | M | 노션 기획안 §12·구현됨 — `POST {sessionId}/matches` |
| R5 | 파싱 결과는 팀 리더의 **확인·수정 후 confirm(승인)** 을 거쳐야 집계에 반영된다. confirm 이후 결과는 수정 불가 — 이후 조정은 운영 메뉴의 점수 조정으로만 가능 | M | FDD §4·유저스토리 §4·구현됨 — `POST {matchId}/confirm` |
| R6 | 스코어보드는 세션 룰에 따라 참가자별 누적 점수를 자동 집계해 **실시간**으로 보여준다 | M | 노션 기획안 §13, 인프라 문서(웹소켓 논의)·구현됨 — `GET scoreboard`, `WebSocketConfig`+`SessionBroadcaster` |
| R7 | Host는 진행 중 세션에서 팀 단위 **점수 보정(adjustments)** 을 할 수 있다. 사유 입력 필수. ⚠️ **이력 저장·공개는 미구현**([FRD 상세](../frd/score-adjustment.md#7-비기능-요구--알려진-구현-갭-️)) | S | FDD §8(정책) 부분 구현 — `AdjustmentRequest(amount, reason: @NotBlank)`, host 전용까지만 확인 |
| R8 | 세션은 종료(end) 또는 재경기(renew)로 마무리된다 | M | 구현됨 |
| R9 | 사용자는 자신의 세션 목록과 매치 히스토리, 개인 전적(총 세션 수·승·패·승률)을 볼 수 있다 | S | 구현됨 — `GET my`, `match-history`, `UserInfoResponse(totalSessions,wins,losses,winRate)` |
| R10 | Top10(생존자 10명 이내) 진입 실패 시 팀 점수 감점 — `RuleType.SURVIVAL_PENALTY`. FDD의 "-2 고정"이 아니라 세션별 `Rule.value`로 **커스터마이징 가능한 기본값** | M | 코드 확인 — [2026-07-15 결정](../../decisions/2026-07-15-current-implementation-as-spec.md) 항목4 |
| R11 | **팀 구성 실시간 협업 채널** — 팀 생성/플레이어 추가·수정·삭제/리더 지정을 WebSocket(STOMP)으로 참가자 전원에게 실시간 브로드캐스트. 채팅 기능 아님 | S | `TeamMessageController` 코드 확인 — [2026-07-15 결정](../../decisions/2026-07-15-current-implementation-as-spec.md) 항목5 |
| R12 | 회원가입 시 `pubgNickname`/`pubgPlayerId`는 **수동 입력 필드** — PUBG 공식 API 자동 조회·연동은 미구현 | S | 코드 확인 — [2026-07-15 결정](../../decisions/2026-07-15-current-implementation-as-spec.md) 항목3 |

## 5. 범위 제외 (Out of Scope)

- 실제 금전 정산/결제 — "킬내기(betting)"는 이름일 뿐, 금전 거래 기능 없음 (노션에 언급 없음, 코드에도 결제 관련 컨트롤러 없음)
- PUBG 공식 API 기반 자동 결과 수집 — 인프라 문서에서 검토했으나 "매치 매칭 로직·데이터 지연 문제로 난이도 높음"으로 기각, OCR 방식 채택 (기획안 §11~12)
- 리더보드, 시즌 경쟁, 디스코드 연동, 랭킹 시스템 — 기획안 §16 향후 확장 항목

## 6. 리스크 & 열린 질문

노션-코드 불일치 5건은 [2026-07-15 결정](../../decisions/2026-07-15-current-implementation-as-spec.md)으로 전부 해소(코드 구현을 최종으로 채택). 남은 진짜 열린 질문만 유지:

| 리스크/질문 | 대응/담당 |
|---|---|
| **닉네임 전역 유일성**은 실사용 중인 알려진 제약으로 수용했으나, 사용자가 늘면 닉네임 충돌로 인한 가입 실패가 잦아질 수 있음 | 사용자 수 증가 시 재검토 (예: 닉네임+구분자 표시 방식 재도입) |
| "킬내기(betting)" 표현의 사행성 이슈 여부 | 팀 논의 권장 (이전 draft에서도 제기, 미결) |

## 7. 관련 FRD

- [세션 관리](../frd/session.md) — 생성·팀구성·시작·종료·이어하기 (`approved`)
- [매치 결과 업로드](../frd/match-upload.md) — 스크린샷 업로드·OCR 파싱 (`approved`)
- [매치 결과 승인](../frd/match-confirm.md) — 확정·룰 적용·자동종료 (`approved`)
- [점수 보정](../frd/score-adjustment.md) — Host 수동 조정, ⚠️ 이력 저장 미구현 (`approved`)

인증(회원가입/로그인)은 별도 FRD 없이 이 PRD §4(R1·R12)로 충분한 것으로 판단, 필요 시 추가.

## 8. 노션 대조 히스토리 (2026-07-14 대조 → 2026-07-15 해소)

노션 기획 원본과 코드 구현을 대조한 결과. 방법: 노션 md 7건(기획안·요구사항목록·유저스토리·백엔드설계초안·FDD작성준비·와이어프레임초안·인프라) + 코드 컨트롤러 6종·핵심 엔티티 대조. **불일치 항목은 전부 [2026-07-15 결정](../../decisions/2026-07-15-current-implementation-as-spec.md)에 따라 "코드 구현이 최종"으로 해소됐다** — 이 표는 원래 계획이 무엇이었고 왜 달라졌는지 추적하기 위한 히스토리로 보존한다.

| # | 노션 기획 (최초 계획) | 코드 구현 (최종 채택) | 상태 |
|---|---|---|---|
| 1 | 회원가입 정보는 "닉네임+PUBG닉네임"만 (§14), 이메일 없음. FDD 1안: 닉네임 중복 허용, 닉네임#id로 구분 | `User`: email(unique)+**nickname(unique)**+password | ✅ 해소 — 구현대로 확정 (결정 항목1) |
| 2 | 유저스토리: "모든 팀 결과 입력 후 매치 확정" | `Match`가 team_id FK 보유 → 팀별 독립 confirm | ✅ 해소 — 구현대로 확정, 실사용상 더 자연스러움 확인 (결정 항목2) |
| 3 | 기획안: PUBG API로 playerId 조회·저장 | `pubgNickname`/`pubgPlayerId` 필드는 존재하나 **수동 입력용**, API 미연동 확정 | ✅ 해소 — 확장 후보로 보류 (결정 항목3) |
| 4 | FDD: Top10 미달성 -2점 고정, 필수 규칙 | `RuleType.SURVIVAL_PENALTY`, 수치는 세션별 커스터마이징 가능한 값 | ✅ 해소 — 기획안 §9 "규칙 커스터마이징" 원칙과 오히려 부합 (결정 항목4) |
| 5 | (노션에 명시 없음) TeamMessageController | 팀 구성 단계 실시간 협업 채널(WebSocket) — 채팅 아님 | ✅ 해소 — 역할 명확화 (결정 항목5) |
| 6 | 인프라 논의: 웹소켓 실시간 브로드캐스트 검토 | `WebSocketConfig`+`SessionBroadcaster` 구현 확인 | ✅ 원래부터 일치 |
| 7 | FDD: 점수조정 사유 입력 필수·**이력 저장·공개**·host 권한 | `AdjustmentRequest.reason` `@NotBlank`, host 전용은 구현됨. **이력 저장·공개는 미구현** — `AdjustmentAppliedEvent`를 구독하는 리스너 없음, `adjustmentScore` 숫자만 누적 | ⚠️ 부분 불일치(2026-07-15 FRD 작성 중 재확인) — 계획 차이가 아니라 **미완성 구현**, 개발 이슈 등록됨 [kill-betting#92](https://github.com/everyware-ie/kill-betting/issues/92) |
| 8 | 기획안 §2.2: "전적 기록 → MVP에서 제거" 논의 중이었음 | `totalSessions`/`wins`/`losses`/`winRate` 필드+응답 DTO 구현됨 | ℹ️ 정보 — 제거 논의와 달리 실제로는 구현됨 (스코프 확장, 문제 아님) |
