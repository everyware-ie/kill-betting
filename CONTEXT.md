# 킬내기 (Kill Betting)

배틀그라운드 킬내기 세션 점수 자동 계산 서비스.
팀들이 매치 결과 이미지를 업로드하면 세션 룰에 따라 점수를 자동 집계한다.

## Language

**Session**:
하나의 킬내기 이벤트 단위. 복수의 Match로 구성된다.
_Avoid_: 게임, 이벤트, 대회

**Match**:
배그 한 판 게임 결과.
_Avoid_: 게임, 라운드

**SessionRule**:
세션별로 정의된 점수 계산 규칙 (킬당 점수, 순위 점수 등).
_Avoid_: 룰, 규칙, 설정

**MatchResult**:
업로드된 이미지에서 파싱된 한 판의 원시 데이터.
_Avoid_: 결과 (ScoreBoard와 혼동 주의)

**ScoreBoard**:
세션 내 Participant별 누적 점수 집계 화면/데이터.
_Avoid_: 결과 (MatchResult와 혼동 주의), 랭킹

**Team**:
세션 내 여러 참가자로 구성된 팀. 솔로 참가자는 1인 팀으로 표현한다.
_Avoid_: Participant (Team이 더 구체적인 경우)

**TeamMember**:
팀에 속한 참가자. 솔로 참가자는 1인 팀의 유일한 TeamMember다.
_Avoid_: 유저, 플레이어

**Host**:
세션을 생성한 사용자. 세션 관리 권한을 보유한다.
_Avoid_: 관리자, 방장

**Leader**:
매치 결과를 업로드하는 역할. 팀당 1명.
_Avoid_: 업로더, 대표

**Placement**:
해당 Match에서의 최종 순위 (1위, 2위 ...).
_Avoid_: 순위 (단독 사용 시 모호)

**Kill**:
한 Match에서의 킬 수.

**TotalScore**:
세션 내 모든 Match 점수의 합산.
_Avoid_: 총점, 합산 점수