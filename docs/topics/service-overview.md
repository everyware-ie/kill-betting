---
title: 킬내기 서비스 현황 종합
product: kill-betting
type: topic
updated: 2026-07-15
related: [kill-betting-core]
---

# 킬내기 — 서비스 현황 종합

> **출처**: 코드 repo [everyware-ie/kill-betting](https://github.com/everyware-ie/kill-betting) 역추출 (main `024face`) + 노션 기획 원본 [team/archive/notion-2026-07/첫 번째 프로젝트 배그 킬내기](https://github.com/everyware-ie/mechuri-docs/tree/main/team/archive/notion-2026-07/첫%20번째%20프로젝트%20배그%20킬내기%20(이름은%20미정)/) 대조 완료. **킬내기는 이미 운영 서버에 배포되어 실사용 중** — 코드 구현이 최종 스펙이다 ([2026-07-15 결정](../decisions/2026-07-15-current-implementation-as-spec.md)). 노션-코드 불일치 히스토리는 [PRD §8](../specs/prd/kill-betting-core.md#8-노션-대조-히스토리-2026-07-14-대조--2026-07-15-해소) 참고.

## 한 줄

배틀그라운드 **킬내기 세션 점수 자동 계산** 서비스 — 팀들이 매치 결과 이미지를 업로드하면 세션 룰에 따라 점수를 자동 집계한다.

## 도메인 용어 (요약)

원본: [코드 repo 용어 사전](https://github.com/everyware-ie/kill-betting/blob/main/.claude/domain/glossary.md) — 기획 문서도 이 용어를 그대로 쓴다.

| 용어 | 뜻 |
|---|---|
| **Session** | 하나의 킬내기 이벤트 단위 (복수 Match로 구성) |
| **Match** | 배그 한 판 게임 결과 |
| **SessionRule** | 세션별 점수 계산 규칙 (킬당 점수, 순위 점수 등) |
| **MatchResult** | 업로드 이미지에서 파싱된 한 판의 원시 데이터 |
| **ScoreBoard** | 세션 내 참가자별 누적 점수 집계 (MatchResult와 혼동 금지) |
| **Team / TeamMember** | 세션 내 팀·팀원 (솔로는 1인 팀) |
| **Host** | 세션 생성자 (관리 권한) |
| **Leader** | 매치 결과를 업로드하는 역할 (팀당 1명) |
| Placement / Kill / TotalScore | 매치 순위 / 킬 수 / 세션 누적 총점 |

## 핵심 플로우 (구현 기준)

1. Host가 **세션 생성** + 룰 설정 (`room/create`, `room/[id]/setup`)
2. 참가자들이 **roomCode로 참가** (`GET /sessions/join/{roomCode}`). 로그인 사용자만 조작 가능, 비로그인은 조회만 (FDD)
3. Host가 **세션 시작** (`POST /{sessionId}/start`) → 라이브 화면 (`room/[id]/live`). 전원 입장 불필요 — 각 팀 최소 1명 로그인 사용자만 있으면 시작 가능 (FDD)
4. 팀 Leader가 각자 **매치 결과 이미지 업로드** (`POST /{sessionId}/matches`) → OCR 파싱 → 확인·수정 후 **confirm으로 승인** (`POST /{matchId}/confirm`). **`Match`는 팀별 독립 레코드**(team_id FK) — 팀마다 각자 confirm하며, confirm 이후 수정 불가
5. **스코어보드 실시간 집계** (`GET /{sessionId}/scoreboard` + WebSocket 브로드캐스트), 매치 히스토리 조회
6. 필요 시 Host가 팀별 **점수 보정** (`POST /{teamId}/adjustments`, 사유 입력 필수)
7. **세션 종료** (`/end`) 또는 **재경기** (`/renew`) → 결과 화면 (`room/[id]/result`)

> ℹ️ **노션 기획과 달라진 지점**: 초기 유저스토리는 "모든 팀의 결과 입력 후 매치 1건 확정"을 전제했으나, 실제 구현(팀별 독립 Match+독립 confirm)이 실사용상 더 자연스러운 것으로 확인되어 **최종 스펙으로 채택**됐다 ([2026-07-15 결정](../decisions/2026-07-15-current-implementation-as-spec.md)).

## 기능 인벤토리 (기능 ↔ API ↔ 화면)

| 기능 | API 표면 | 화면 |
|---|---|---|
| 회원가입·로그인·내 정보 | `/signup` `/login` `/me` `check-nickname` | `auth/signup` `auth/login` `mypage` |
| 세션 생성·설정 | `POST /sessions`, `PUT /{sessionId}/rules/{ruleId}` | `room/create` `room/[id]/setup` |
| 참가 (초대 코드) | `GET /sessions/join/{roomCode}`, `GET /participants` | `room/[id]` |
| 세션 진행 | `POST /{sessionId}/start` `/end` `/renew` | `room/[id]/live` |
| 매치 결과 업로드·승인 | `POST /{sessionId}/matches`, `POST /{matchId}/confirm` | `room/[id]/live` |
| 점수 집계·조회 | `GET /{sessionId}/scoreboard` `/match-history` | `room/[id]/live` `room/[id]/result` |
| 점수 보정 | `POST /{teamId}/adjustments` | 운영 메뉴 → 점수 조정 모달. ⚠️ 이력 저장 미구현([보정 FRD](../specs/frd/score-adjustment.md#7-비기능-요구--알려진-구현-갭-️)) |
| 팀 구성 실시간 협업 | `TeamMessageController` (WebSocket/STOMP) | `room/[id]/setup` — 팀 생성·플레이어 추가/수정/삭제·리더 지정을 참가자 전원에 실시간 브로드캐스트 |
| 내 세션 목록 | `GET /sessions/my` | `dashboard` |

## 남은 열린 질문

- 닉네임 전역 유일 제약 — 사용자 증가 시 재검토 여지 (PRD §6)
- "킬내기(betting)" 표현의 사행성 이슈 여부 — 팀 논의 미결

## 관련

- PRD (**approved**): [specs/prd/kill-betting-core.md](../specs/prd/kill-betting-core.md)
- FRD: [세션](../specs/frd/session.md) · [업로드](../specs/frd/match-upload.md) · [승인](../specs/frd/match-confirm.md) · [보정](../specs/frd/score-adjustment.md)
- 결정: [2026-07-15 현재 구현을 최종 스펙으로 채택](../decisions/2026-07-15-current-implementation-as-spec.md)
- 노션 원본: [team/archive/notion-2026-07](https://github.com/everyware-ie/mechuri-docs/tree/main/team/archive/notion-2026-07/)
- 코드 repo 연동 규칙: [kill-betting#91](https://github.com/everyware-ie/kill-betting/pull/91)
