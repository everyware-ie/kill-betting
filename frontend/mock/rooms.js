/**
 * ============================================================
 *  mock/rooms.js — 방/팀 Mock 데이터
 * ============================================================
 *
 *  [개념 정리]
 *
 *  방 참여자 (participants)
 *    - 로그인해서 방에 들어온 유저
 *    - 방 운영 담당 (결과 입력, 관리)
 *    - user.id 로 식별
 *
 *  킬내기 참가자 (players)
 *    - 실제 배그에서 킬내기하는 사람
 *    - 배그 닉네임 문자열만 존재 (계정 연동 없음)
 *    - 팀 구성 시 직접 입력
 *
 * ============================================================
 */

/** 게임 모드별 팀당 최대 인원 */
export const MAX_PLAYERS_PER_TEAM = {
  '솔로': 1,
  '듀오': 2,
  '스쿼드': 4,
};

/** 팀 이름 목록 (최대 6팀) */
export const TEAM_NAMES = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT'];

/** 기본 룰 설정 */
export const DEFAULT_RULE = {
  gameMode: '스쿼드',         // '솔로' | '듀오' | '스쿼드'
  targetKills: 20,            // 목표 킬 수
  timeLimitMin: 60,           // 제한 시간 (분)
  noTimeLimit: false,         // 시간 제한 없음

  // 보너스
  headShotBonusOn: true,
  headShotBonus: 2,
  assistBonusOn: true,
  assistBonus: 1,
  chickenBonusOn: true,
  chickenBonus: 5,

  // 패널티
  teamKillPenaltyOn: true,
  teamKillPenalty: 5,
  deathPenaltyOn: false,
  deathPenalty: 1,
};

/** 기본 팀 구조 생성 */
export const createDefaultTeams = () => [
  {
    id: 'team-alpha',
    name: 'TEAM ALPHA',
    players: [],   // 배그 닉네임 문자열 배열 (킬내기 참가자)
    members: [],   // 로그인 유저 배열 (방 참여자) → { userId, username, role: 'LEADER'|'MEMBER' }
  },
  {
    id: 'team-bravo',
    name: 'TEAM BRAVO',
    players: [],
    members: [],
  },
];

// 런타임 방 저장소 (페이지 새로고침 시 초기화)
export const _runtimeRooms = [];
