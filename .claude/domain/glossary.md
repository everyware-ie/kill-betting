# 도메인 용어 사전

코드 네이밍, AI 프롬프트, 기획 문서에서 아래 용어를 일관되게 사용한다.
새로운 도메인 용어가 생기면 팀 합의 후 이 파일에 추가한다.

---

## 핵심 용어

| 용어 (영문)         | 한국어   | 설명 |
|-----------------|-------|------|
| **Session**     | 세션    | 하나의 킬내기 이벤트 단위. 복수의 Match로 구성됨 |
| **Match**       | 매치    | 배그 한 판 게임 결과 |
| **SessionRule** | 세션 룰  | 세션별로 정의된 점수 계산 규칙 (킬당 점수, 순위 점수 등) |
| **MatchResult** | 매치 결과 | 업로드된 이미지에서 파싱된 한 판의 원시 데이터 |
| **ScoreBoard**  | 스코어보드 | 세션 내 Participant별 누적 점수 집계 화면/데이터 |
| **TeamMember**  | 팀원    | 팀에 속한 참가자 (솔로 참가자는 1인 팀의 유일한 팀원) |
| **Team**        | 팀     | 세션 내 여러 참가자로 구성된 팀 (솔로 참가자는 1인 팀으로 표현) |
| **Host**        | 호스트   | 세션을 생성한 사용자 (세션 관리 권한 보유) |
| **Leader**      | 리더    | 매치 결과를 업로드하는 역할 (팀당 1명) |
| **Placement**   | 순위    | 해당 Match에서의 최종 순위 (1위, 2위 ...) |
| **Kill**        | 킬     | 한 Match에서의 킬 수 |
| **TotalScore**  | 총점    | 세션 내 모든 Match 점수의 합산 |
| **ChickenBonus** | 치킨 보너스 | 치킨(1위) 달성 시 팀에 +value 보너스 (RuleType) |
| **SurvivalPenalty** | 생존 패널티(인당) | TOP10 진입 실패자 **인원 수 × value** 만큼 팀 감점 (RuleType) |
| **TeamSurvivalPenalty** | 팀 생존 패널티 | 팀원 **전원**이 TOP10 진입에 실패해야 팀 전체 **-value (1회)** 감점. 1명이라도 TOP10에 성공하면 감점 없음. SurvivalPenalty와 **택일** (RuleType) |
| **Admin**       | 어드민   | 개발자·서비스 운영자용 읽기 전용 운영 지표 대시보드 (호스트용 세션 운영 메뉴와 별개) |
| **ActiveUser**  | 활성 유저 | 지정된 최근 기간(예: 7일/30일) 내에 세션에 참여한 유저 |
| **Retention**   | 리텐션   | 신규 가입 유저가 이후 다시 서비스를 사용하는 비율. W1 = 가입 후 7일 내 세션 1회 이상 참여 비율 |
| **InactivityTimeout** | 무응답 자동종료 | IN_PROGRESS 세션이 **마지막 매치 확정(confirm)** 시점부터 지정 시간(기본 6h) 동안 새 매치가 없으면 자동 종료. 종료 사유는 `SessionEndReason.INACTIVITY` |
| **StaleWaitingRoom** | 미시작 자동삭제 | WAITING 세션이 **생성 후** 지정 시간(기본 3h) 동안 시작되지 않으면 자동 삭제(soft delete) |
| **SoftDelete**  | 소프트 삭제 | 세션을 행 삭제하지 않고 `deletedAt`을 세팅해 논리적으로 제거. 조회는 `deletedAt IS NULL`로 필터. 수동 삭제(Host)·미시작 자동삭제가 공유하는 삭제 방식 |

---

## 용어 사용 시 주의

- `결과`라는 단어는 **MatchResult**(파싱된 원시 데이터)와 **ScoreBoard**(집계된 점수)를 혼동하기 쉬움 → 반드시 구분해서 사용
- `팀`은 서비스 내에서 **Participant**로 통일 (솔로 참가도 Participant로 표현)
- `게임`은 **Match**로, `이벤트/대회`는 **Session**으로 표현
- 생존 패널티는 **SurvivalPenalty(인당)** 와 **TeamSurvivalPenalty(팀 1회)** 중 하나만 사용 가능 (세션당 택일, 백엔드에서 강제)
- 세션 자동 정리는 **InactivityTimeout(진행중→종료)** 와 **StaleWaitingRoom(대기중→삭제)** 로 구분 — 전자는 데이터 보존을 위해 *종료*, 후자는 데이터가 없어 *삭제*
- **자동종료**(InactivityTimeout, 시간만료)와 **자동삭제**(StaleWaitingRoom)는 다른 개념 — 종료는 상태를 ENDED로, 삭제는 SoftDelete로 처리
