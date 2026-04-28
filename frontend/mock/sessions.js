/**
 * ============================================================
 *  mock/sessions.js — 킬내기 방 Mock 데이터
 * ============================================================
 *
 *  [개념 정리]
 *
 *  session (방)
 *    - 방 참여자(participants): 로그인 유저, 방 운영 담당
 *    - 팀(teams): 배그 닉네임 문자열만 존재, 계정 연동 없음
 *
 *  participant (방 참여자)
 *    - 로그인한 유저
 *    - 스크린샷 업로드 / 결과 입력 담당
 *    - 킬내기 참가자와 별개 개념
 *
 *  team player (킬내기 참가자)
 *    - 배그 인게임 닉네임만 존재
 *    - 계정 없음, 중복 허용
 *    - OCR 결과 매칭 기준
 *
 * ============================================================
 */

/** 기본 룰 설정값 */
export const DEFAULT_RULE = {
  gameMode:          '스쿼드',   // '솔로' | '듀오' | '스쿼드'
  targetKills:       30,          // 목표 킬 수
  timeLimitMin:      60,          // 제한 시간 (분)
  noTimeLimit:       false,       // 시간 제한 없음

  // 보너스
  headShotBonusOn:   true,
  headShotBonus:     2,
  assistBonusOn:     true,
  assistBonus:       1,
  chickenBonusOn:    true,
  chickenBonus:      5,

  // 패널티
  teamKillPenaltyOn: true,
  teamKillPenalty:   5,
  deathPenaltyOn:    false,
  deathPenalty:      1,
};

/** 팀 이름 목록 (최대 6팀) */
export const TEAM_NAMES = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT'];

/** 팀 최대 인원 */
export const MAX_PLAYERS = {
  '솔로': 1,
  '듀오': 2,
  '스쿼드': 4,
};

/** Mock 세션 목록 */
export const MOCK_SESSIONS = [
  {
    id: 'session-001',
    title: '금요일 스쿼드 킬내기',
    code: '#1234-56',
    status: 'DONE',      // 'WAITING' | 'LIVE' | 'DONE'
    hostId: 'user-001',
    rule: { ...DEFAULT_RULE },
    teams: [
      { id: 'team-a', name: 'TEAM ALPHA', players: [{ id: 'p1', nick: '홍길동' }, { id: 'p2', nick: '이순신' }] },
      { id: 'team-b', name: 'TEAM BRAVO', players: [{ id: 'p3', nick: '을지문덕' }, { id: 'p4', nick: '계백' }] },
    ],
    createdAt: '2024-03-01T18:00:00Z',
  },
];
