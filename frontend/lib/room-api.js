/**
 * ============================================================
 *  lib/room-api.js — 방(Session) 관련 API
 * ============================================================
 *
 *  [실제 API 연결 현황]
 *
 *  ✅ 연결됨
 *    create, list, get, joinByCode
 *    joinTeam, addTeam, addPlayer, removePlayer, setLeader
 *    start, getMatches
 *
 *  🔶 Mock 유지 (백엔드 미구현)
 *    leaveTeam     — 팀 탈퇴 엔드포인트 없음
 *    updateRule    — 룰 수정 엔드포인트 없음
 *    addAdjustment — 점수 수동 조정 엔드포인트 없음
 *    end           — 경기 종료 엔드포인트 없음
 *    addMatch      — OCR 흐름이 백엔드에서 통합 처리됨 (TODO)
 *
 *  [백엔드 ↔ 프론트 데이터 구조 차이]
 *
 *  Backend Session Response:
 *    { id, name, hostNickname, status, roomUrl, targetKills, timeLimitMinutes }
 *
 *  Backend ConfigureState Response:
 *    { sessionId, waitingUsers:[{userId,nickname}], teams:[{teamId,teamName,status,
 *       operatorUserId,operatorNickname,players:[{playerId,playerNickname}]}] }
 *
 *  Frontend Room 형식:
 *    { id, title, code, status, rule, teams:[{id,name,members,players,_playerIds}],
 *      participants, hostNickname }
 *
 * ============================================================
 */

import { USE_MOCK, apiFetch, getToken } from '@/lib/api';
import { MOCK_ROOMS, MAX_PLAYERS_PER_TEAM } from '@/mock/rooms';

// ─────────────────────────────────────────
//  공통 헬퍼
// ─────────────────────────────────────────

const ok    = (data = {}) => ({ ok: true,  ...data });
const err   = (msg)       => ({ ok: false, error: msg });
const delay = (ms = 350)  => new Promise((r) => setTimeout(r, ms));

// Mock 런타임 방 목록 (메모리 내 상태)
let _runtimeRooms = MOCK_ROOMS.map((r) => ({ ...r }));


// ─────────────────────────────────────────
//  세션 메타데이터 캐시 (localStorage)
//  실제 API 모드에서 백엔드가 반환하지 않는 정보(rule, code 등)를 저장
// ─────────────────────────────────────────

function loadSessionMeta() {
  try { return JSON.parse(localStorage.getItem('kc_session_meta') || '{}'); } catch { return {}; }
}

function saveSessionMeta(meta) {
  try { localStorage.setItem('kc_session_meta', JSON.stringify(meta)); } catch {}
}

function cacheSession(sessionId, data) {
  const meta = loadSessionMeta();
  meta[String(sessionId)] = { ...meta[String(sessionId)], ...data };
  saveSessionMeta(meta);
}

function getCachedSession(sessionId) {
  return loadSessionMeta()[String(sessionId)] || null;
}

// ─────────────────────────────────────────
//  기본 룰 (백엔드 룰 스펙이 프론트와 다를 때 fallback)
// ─────────────────────────────────────────

const DEFAULT_RULE = {
  gameMode: '스쿼드',
  targetKills: 20,
  timeLimit: 60,
  headShotBonusOn: false, headShotBonus: 1,
  assistBonusOn: false,   assistBonus: 1,
  chickenBonusOn: false,  chickenBonus: 5,
  teamKillPenaltyOn: false, teamKillPenalty: 5,
  deathPenaltyOn: false,    deathPenalty: 1,
};

// ─────────────────────────────────────────
//  Backend → Frontend 데이터 어댑터
// ─────────────────────────────────────────

/**
 * ConfigureStateMessage + 세션 메타 → 프론트 room 객체 변환
 *
 * @param {object} configure  GET /api/sessions/{id}/configure 응답
 * @param {object} cachedMeta 로컬 캐시 (title, code, rule, hostNickname 등)
 */
function buildRoomFromBackend(configure, cachedMeta = {}) {
  const hostNickname = cachedMeta.hostNickname || null;

  // 팀 변환
  const teams = (configure.teams || []).map((t) => {
    const players    = (t.players || []).map((p) => p.playerNickname);
    const _playerIds = Object.fromEntries((t.players || []).map((p) => [p.playerNickname, p.playerId]));
    const members    = t.operatorUserId
      ? [{
          userId:   String(t.operatorUserId),
          username: t.operatorNickname,
          role:     t.operatorNickname === hostNickname ? 'LEADER' : 'LEADER',
          // 방장이 팀에 있어도 LEADER 역할로 표시 (👑 방장 배지는 hostNickname 비교로 결정)
        }]
      : [];
    return {
      id:         String(t.teamId),
      name:       t.teamName,
      members,
      players,
      _playerIds, // 닉네임 → playerId 매핑 (서버 삭제 시 필요)
    };
  });

  // 대기 유저 → participants
  const participants = (configure.waitingUsers || []).map((u) => ({
    userId:   String(u.userId),
    username: u.nickname,
    role:     u.nickname === hostNickname ? 'HOST' : 'MEMBER',
    joinedAt: new Date().toISOString(),
  }));

  // 팀에 있는 유저도 participants에 포함 (방장 확인용)
  teams.forEach((t) => {
    t.members.forEach((m) => {
      if (!participants.some((p) => p.userId === m.userId)) {
        participants.push({
          userId:   m.userId,
          username: m.username,
          role:     m.username === hostNickname ? 'HOST' : 'MEMBER',
          joinedAt: new Date().toISOString(),
        });
      }
    });
  });

  return {
    id:           String(configure.sessionId),
    title:        cachedMeta.title       || `킬내기 #${configure.sessionId}`,
    code:         cachedMeta.code        || String(configure.sessionId),
    status:       cachedMeta.status      || 'WAITING',
    rule:         cachedMeta.rule        || DEFAULT_RULE,
    hostNickname: hostNickname,
    teams,
    participants,
  };
}

/**
 * 프론트 rule → 백엔드 CreateRequest body 변환
 *
 * 백엔드: { name, targetKills, timeLimitMinutes, rules:[] }
 * 현재 룰 상세(헤드샷 보너스 등)는 백엔드에 직접 저장하지 않고 캐시에 보관
 */
function buildCreateRequest(title, rule) {
  const rules = [];
  // 백엔드가 지원하는 룰 타입만 전송 (추후 확장)
  if (rule?.chickenBonusOn)      rules.push({ ruleType: 'CHICKEN_BONUS',          operator: 'GTE', value: rule.chickenBonus });
  if (rule?.deathPenaltyOn)      rules.push({ ruleType: 'SURVIVAL_PENALTY',        operator: 'GTE', value: rule.deathPenalty });
  if (rule?.teamKillPenaltyOn)   rules.push({ ruleType: 'CONSECUTIVE_DEATH_PENALTY', operator: 'GTE', value: rule.teamKillPenalty });

  return {
    name:             title,
    targetKills:      rule?.targetKills      || 20,
    timeLimitMinutes: rule?.timeLimit        || 60,
    rules,
  };
}

/**
 * 백엔드 ScoreboardResponse + MatchHistoryResponse → 프론트 matches 배열 변환
 *
 * 프론트 live 페이지는 matches 배열로 팀별 점수를 계산함.
 * 백엔드는 팀별 aggregated scores(scoreboard)와 match log(history)를 분리 제공.
 */
function buildMatchesFromBackend(scoreboard, matchHistory) {
  const teams = scoreboard?.teams || [];

  // scoreboard → 팀별 총점 pseudo-match (점수 계산용)
  const scoreMatches = teams.map((t) => ({
    id:          `score-${t.teamId}`,
    teamId:      String(t.teamId),
    matchNumber: 0,
    isScoreboard: true,
    results:     (t.members || []).map((m) => ({
      playerId:      String(m.playerId),
      playerName:    m.playerNickname,
      kills:         m.totalKills,
      bonusKills:    m.bonusKills,
      penaltyKills:  m.penaltyKills,
      effectiveKills:m.effectiveKills,
    })),
    adjustedScore: t.effectiveKills,
  }));

  // matchHistory → 개별 매치 로그 (팀별로 split)
  const historyMatches = (matchHistory?.matches || []).flatMap((match) => {
    const teamIds = [...new Set((match.memberResults || []).map((r) => r.teamId))];
    return teamIds.map((teamId) => ({
      id:          `${match.matchId}-${teamId}`,
      matchId:     match.matchId,
      teamId:      String(teamId),
      matchNumber: match.matchNumber,
      mapName:     match.mapName,
      playedAt:    match.playedAt,
      results:     (match.memberResults || [])
        .filter((r) => r.teamId === teamId)
        .map((r) => ({
          playerId:       String(r.playerId),
          playerName:     r.playerNickname,
          kills:          r.kills,
          bonusKills:     r.bonusKills,
          penaltyKills:   r.penaltyKills,
          effectiveKills: r.effectiveKills,
          placement:      r.placement,
          isChicken:      r.isChicken,
        })),
    }));
  });

  return [...scoreMatches, ...historyMatches];
}


// ─────────────────────────────────────────
//  RoomAPI
// ─────────────────────────────────────────

export const RoomAPI = {

  // ── 방 목록 조회 ────────────────────────────────────────
  list: async () => {
    if (USE_MOCK) {
      await delay(250);
      return ok({ rooms: _runtimeRooms });
    }
    // GET /api/sessions/my → 내가 참여한 세션 목록
    const res = await apiFetch('/api/sessions/my');
    if (!res.ok) return res;

    const sessions = Array.isArray(res) ? res : (res.sessions || []);
    const rooms = sessions.map((s) => {
      const cached = getCachedSession(s.id) || {};
      return {
        id:        String(s.id),
        title:     s.name,
        code:      s.roomUrl,
        status:    s.status,
        createdAt: s.createdAt,
        rule:      cached.rule || DEFAULT_RULE,
        teams:     [],  // 목록에서는 팀 상세 불필요
      };
    });
    return ok({ rooms });
  },

  // ── 방 생성 ────────────────────────────────────────────
  /**
   * @param {string} title    방 이름
   * @param {object} rule     프론트 룰 객체
   * @param {object} hostUser { id, username } 로그인 유저
   */
  create: async (title, rule, hostUser) => {
    const hostUserId   = typeof hostUser === 'object' ? hostUser.id       : hostUser;
    const hostUsername = typeof hostUser === 'object' ? hostUser.username : hostUser;

    if (USE_MOCK) {
      await delay(400);
      const maxP = MAX_PLAYERS_PER_TEAM[rule?.gameMode] || 4;
      const room = {
        id:    `room-${Date.now()}`,
        title, code: `#${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(10 + Math.random() * 89)}`,
        status: 'WAITING',
        rule,
        teams: [
          { id: 'team-alpha', name: 'TEAM ALPHA', players: [], members: [] },
          { id: 'team-bravo', name: 'TEAM BRAVO', players: [], members: [] },
        ],
        participants: [{
          userId: hostUserId, username: hostUsername,
          role: 'HOST', joinedAt: new Date().toISOString(),
        }],
        hostNickname: hostUsername,
        maxPlayersPerTeam: maxP,
        createdAt: new Date().toISOString(),
      };
      _runtimeRooms.push(room);
      return ok({ room });
    }

    // POST /api/sessions
    const body = buildCreateRequest(title, rule);
    const res  = await apiFetch('/api/sessions', {
      method: 'POST',
      body:   JSON.stringify(body),
    });
    if (!res.ok) return res;

    const sessionId = String(res.id);

    // 방 생성 후 자동 입장 (SessionUser 등록)
    await apiFetch(`/api/sessions/${sessionId}/join`, { method: 'POST' });

    // 룰·호스트 정보는 백엔드가 저장하지 않으므로 로컬 캐시에 보관
    cacheSession(sessionId, {
      id:           sessionId,
      title:        res.name || title,
      code:         res.roomUrl,
      status:       res.status,
      rule,
      hostNickname: hostUsername,
      hostUserId:   hostUserId,
      createdAt:    res.createdAt,
    });

    // 빈 configure state 로 room 객체 구성
    const room = {
      id:           sessionId,
      title:        res.name || title,
      code:         res.roomUrl,
      status:       res.status,
      rule,
      hostNickname: hostUsername,
      teams:        [],
      participants: [{ userId: hostUserId, username: hostUsername, role: 'HOST', joinedAt: new Date().toISOString() }],
    };
    return ok({ room });
  },

  // ── 방 정보 조회 ───────────────────────────────────────
  /**
   * @param {string} roomId  세션 ID (숫자) 또는 mock 방 ID
   */
  get: async (roomId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ room });
    }

    // GET /api/sessions/{sessionId}/configure
    const configRes = await apiFetch(`/api/sessions/${roomId}/configure`);
    if (!configRes.ok) return configRes;

    const cachedMeta = getCachedSession(roomId) || {};

    // configure.sessionId 가 없을 경우 roomId 사용
    const configure = { sessionId: roomId, ...configRes };
    const room = buildRoomFromBackend(configure, cachedMeta);
    return ok({ room });
  },

  // ── 초대 코드로 방 입장 ─────────────────────────────────
  /**
   * @param {string} code  초대 코드 (roomUrl)
   * @param {object} user  로그인 유저
   */
  joinByCode: async (code, user) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.code === code);
      if (!room) return err('존재하지 않는 초대 코드입니다');
      if (room.status !== 'WAITING') return err('이미 시작된 방입니다');
      if (!room.participants.some((p) => p.userId === user?.id)) {
        room.participants.push({ userId: user.id, username: user.username, role: 'MEMBER', joinedAt: new Date().toISOString() });
      }
      return ok({ roomId: room.id });
    }

    // 1. 코드(roomUrl)로 세션 조회
    const sessionRes = await apiFetch(`/api/sessions/join/${encodeURIComponent(code)}`);
    if (!sessionRes.ok) return sessionRes;

    const sessionId = String(sessionRes.id);

    // 2. 세션 입장 (SessionUser 등록)
    const joinRes = await apiFetch(`/api/sessions/${sessionId}/join`, { method: 'POST' });
    if (!joinRes.ok) return joinRes;

    // 세션 메타 캐시에 저장
    cacheSession(sessionId, {
      id:           sessionId,
      title:        sessionRes.name,
      code:         sessionRes.roomUrl || code,
      status:       sessionRes.status,
      hostNickname: sessionRes.hostNickname,
      rule:         DEFAULT_RULE,  // 백엔드에서 룰 상세를 반환하지 않으므로 기본값
      createdAt:    sessionRes.createdAt,
    });

    return ok({ roomId: sessionId });
  },

  // ── 팀 참여 / 이동 (자신을 해당 팀 LEADER 로 설정) ───────
  /**
   * @param {string} roomId  세션 ID
   * @param {string} teamId  팀 ID
   * @param {object} user    로그인 유저
   */
  joinTeam: async (roomId, teamId, user) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const targetTeam = room.teams.find((t) => t.id === teamId);
      const alreadyOccupied = (targetTeam?.members || []).some((m) => m.userId !== user.id);
      if (alreadyOccupied) return err('이미 다른 팀원이 있는 팀입니다');
      room.teams = room.teams.map((t) => ({
        ...t,
        members: (t.members || []).filter((m) => m.userId !== user.id),
      }));
      room.teams = room.teams.map((t) => {
        if (t.id !== teamId) return t;
        return { ...t, members: [{ userId: user.id, username: user.username, role: 'LEADER' }] };
      });
      return ok({ teams: room.teams });
    }

    // PUT /api/sessions/{sessionId}/teams/{teamId}/operator
    // 자신을 해당 팀 operator 로 지정
    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/operator`, {
      method: 'PUT',
      body:   JSON.stringify({ userId: Number(user.id) }),
    });
    if (!res.ok) return res;

    // 팀 이동 후 configure 재조회해서 최신 teams 반환
    const configRes = await apiFetch(`/api/sessions/${roomId}/configure`);
    if (!configRes.ok) return ok({ teams: [] }); // 실패해도 UI는 유지

    const cachedMeta = getCachedSession(roomId) || {};
    const configure  = { sessionId: roomId, ...configRes };
    const room       = buildRoomFromBackend(configure, cachedMeta);
    return ok({ teams: room.teams });
  },

  // ── 대기석으로 이동 (팀 탈퇴) ──────────────────────────
  /**
   * TODO: 백엔드에 팀 탈퇴 엔드포인트 없음 → mock 유지
   * 실제로는 operator 해제 API 필요
   */
  leaveTeam: async (roomId, teamId, userId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.teams = room.teams.map((t) => {
        if (t.id !== teamId) return t;
        const remaining = t.members.filter((m) => m.userId !== userId);
        const hasLeader = remaining.some((m) => m.role === 'LEADER');
        if (!hasLeader && remaining.length > 0) {
          remaining[0] = { ...remaining[0], role: 'LEADER' };
        }
        return { ...t, members: remaining };
      });
      return ok({ teams: room.teams });
    }

    // TODO: DELETE /api/sessions/{sessionId}/teams/{teamId}/operator 구현 시 연결
    // 임시: configure 재조회 후 mock처럼 처리
    return ok({ teams: [] });
  },

  // ── 팀 추가 ────────────────────────────────────────────
  addTeam: async (roomId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const names = ['TEAM ALPHA', 'TEAM BRAVO', 'TEAM CHARLIE', 'TEAM DELTA', 'TEAM ECHO', 'TEAM FOXTROT'];
      const nextName = names[room.teams.length] || `TEAM ${room.teams.length + 1}`;
      room.teams.push({ id: `team-${Date.now()}`, name: nextName, players: [], members: [] });
      return ok({ teams: room.teams });
    }

    // POST /api/sessions/{sessionId}/teams
    const names = ['TEAM ALPHA', 'TEAM BRAVO', 'TEAM CHARLIE', 'TEAM DELTA', 'TEAM ECHO', 'TEAM FOXTROT'];

    // 팀 개수 파악 후 이름 결정 (configure 조회)
    let teamName = 'NEW TEAM';
    const configRes = await apiFetch(`/api/sessions/${roomId}/configure`);
    if (configRes.ok) {
      const count = (configRes.teams || []).length;
      teamName = names[count] || `TEAM ${count + 1}`;
    }

    const res = await apiFetch(`/api/sessions/${roomId}/teams`, {
      method: 'POST',
      body:   JSON.stringify({ name: teamName }),
    });
    if (!res.ok) return res;

    // 팀 추가 후 configure 재조회
    const newConfigRes = await apiFetch(`/api/sessions/${roomId}/configure`);
    if (!newConfigRes.ok) return ok({ teams: [] });
    const cachedMeta = getCachedSession(roomId) || {};
    const configure  = { sessionId: roomId, ...newConfigRes };
    const room       = buildRoomFromBackend(configure, cachedMeta);
    return ok({ teams: room.teams });
  },

  // ── 배그 닉네임 추가 ────────────────────────────────────
  /**
   * @param {string} roomId    세션 ID
   * @param {string} teamId    팀 ID
   * @param {string} nickname  추가할 PUBG 닉네임
   */
  addPlayer: async (roomId, teamId, nickname) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const team = room.teams.find((t) => t.id === teamId);
      if (!team) return err('팀을 찾을 수 없습니다');
      if (team.players.includes(nickname)) return err('이미 등록된 닉네임입니다');
      team.players.push(nickname);
      return ok();
    }

    // POST /api/sessions/{sessionId}/teams/{teamId}/players
    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/players`, {
      method: 'POST',
      body:   JSON.stringify({ playerNickname: nickname }),
    });
    return res.ok ? ok() : res;
  },

  // ── 배그 닉네임 삭제 ────────────────────────────────────
  /**
   * @param {string} roomId    세션 ID
   * @param {string} teamId    팀 ID
   * @param {string} nickname  삭제할 PUBG 닉네임
   * @param {number} [playerId] 플레이어 ID (실제 API 전용, 없으면 configure 에서 조회)
   */
  removePlayer: async (roomId, teamId, nickname, playerId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const team = room.teams.find((t) => t.id === teamId);
      if (!team) return err('팀을 찾을 수 없습니다');
      team.players = team.players.filter((p) => p !== nickname);
      return ok();
    }

    // playerId 가 없으면 configure 에서 조회
    let pid = playerId;
    if (!pid) {
      const configRes = await apiFetch(`/api/sessions/${roomId}/configure`);
      if (configRes.ok) {
        const backendTeam = (configRes.teams || []).find((t) => String(t.teamId) === String(teamId));
        const player      = (backendTeam?.players || []).find((p) => p.playerNickname === nickname);
        pid = player?.playerId;
      }
    }

    if (!pid) return err('플레이어 ID를 찾을 수 없습니다');

    // DELETE /api/sessions/{sessionId}/teams/{teamId}/players/{playerId}
    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/players/${pid}`, {
      method: 'DELETE',
    });
    return res.ok ? ok() : res;
  },

  /**
   * updateTeams — 하위 호환용 (mock 전용)
   * 실제 API 에서는 addPlayer / removePlayer 를 직접 사용
   */
  updateTeams: async (roomId, updatedTeams) => {
    if (USE_MOCK) {
      await delay(150);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.teams = updatedTeams;
      return ok({ teams: updatedTeams });
    }
    // 실제 API 에서는 개별 addPlayer/removePlayer 호출 필요
    return ok({ teams: updatedTeams });
  },

  // ── 리더 위임 ──────────────────────────────────────────
  setLeader: async (roomId, teamId, newLeaderUserId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.teams = room.teams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          members: t.members.map((m) => ({
            ...m,
            role: m.userId === newLeaderUserId ? 'LEADER' : 'MEMBER',
          })),
        };
      });
      return ok({ teams: room.teams });
    }

    // PUT /api/sessions/{sessionId}/teams/{teamId}/operator
    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/operator`, {
      method: 'PUT',
      body:   JSON.stringify({ userId: Number(newLeaderUserId) }),
    });
    return res.ok ? ok() : res;
  },

  // ── 룰 수정 ────────────────────────────────────────────
  /**
   * TODO: 백엔드 룰 수정 엔드포인트 없음 → 로컬 캐시만 업데이트
   */
  updateRule: async (roomId, newRule) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.rule = newRule;
      return ok({ room });
    }
    // 캐시만 업데이트 (백엔드 엔드포인트 없음)
    cacheSession(roomId, { rule: newRule });
    return ok();
  },

  // ── 킬내기 시작 ────────────────────────────────────────
  start: async (roomId) => {
    if (USE_MOCK) {
      await delay(500);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.status = 'ACTIVE';
      return ok();
    }

    // POST /api/sessions/{sessionId}/start
    const res = await apiFetch(`/api/sessions/${roomId}/start`, { method: 'POST' });
    if (res.ok) cacheSession(roomId, { status: 'ACTIVE' });
    return res.ok ? ok() : res;
  },

  // ── 매치 목록 조회 (라이브 페이지 폴링용) ──────────────
  getMatches: async (roomId) => {
    if (USE_MOCK) {
      await delay(200);
      return ok({ matches: [] });
    }

    // 스코어보드 + 매치 히스토리 병렬 조회
    const [scoreRes, historyRes] = await Promise.all([
      apiFetch(`/api/sessions/${roomId}/scoreboard`),
      apiFetch(`/api/sessions/${roomId}/match-history`),
    ]);

    const scoreboard   = scoreRes.ok   ? scoreRes   : null;
    const matchHistory = historyRes.ok ? historyRes : null;

    const matches = buildMatchesFromBackend(scoreboard, matchHistory);
    return ok({ matches });
  },

  // ── 매치 결과 저장 (OCR 업로드) ────────────────────────
  /**
   * TODO: 백엔드 OCR 흐름이 다름 (서버 측 OCR 처리)
   *   실제 API: POST /api/sessions/{sessionId}/matches (multipart image)
   *             → { matchId, screenshotUrl }
   *   이후: POST /api/matches/{matchId}/confirm
   *
   * 현재는 mock 유지. WebSocket 연동 및 서버 OCR 흐름 정립 후 연결 예정.
   */
  addMatch: async (roomId, teamId, data) => {
    if (USE_MOCK) {
      await delay(600);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const team = room.teams.find((t) => t.id === teamId);
      if (!team) return err('팀을 찾을 수 없습니다');
      const matchCount = (room._matches || []).filter((m) => m.teamId === teamId).length;
      const match = {
        id:          `match-${Date.now()}`,
        roomId,      teamId,
        matchNumber: matchCount + 1,
        results:     data.results  || [],
        adjustments: data.adjustments || [],
        createdAt:   new Date().toISOString(),
      };
      room._matches = [...(room._matches || []), match];
      return ok({ match });
    }

    // TODO: 실제 API 연결 시 아래 코드 사용
    // const formData = new FormData();
    // formData.append('image', data.imageFile);
    // const uploadRes = await apiFetch(`/api/sessions/${roomId}/matches`, { method: 'POST', body: formData });
    // if (!uploadRes.ok) return uploadRes;
    // const confirmRes = await apiFetch(`/api/matches/${uploadRes.matchId}/confirm`, { method: 'POST' });
    // return confirmRes.ok ? ok({ match: { id: uploadRes.matchId } }) : confirmRes;

    return err('OCR 업로드는 아직 준비 중입니다');
  },

  // ── 점수 수동 조정 ──────────────────────────────────────
  /**
   * TODO: 백엔드 점수 조정 엔드포인트 없음 → mock 유지
   */
  addAdjustment: async (roomId, data) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room._adjustments = [...(room._adjustments || []), { ...data, id: `adj-${Date.now()}` }];
      return ok();
    }
    // TODO: POST /api/sessions/{sessionId}/adjustments 구현 시 연결
    return err('점수 조정은 아직 지원되지 않습니다');
  },

  // ── 경기 종료 ───────────────────────────────────────────
  /**
   * TODO: 백엔드 경기 종료 엔드포인트 없음 → mock 유지
   */
  end: async (roomId) => {
    if (USE_MOCK) {
      await delay(400);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.status = 'FINISHED';
      return ok();
    }
    // TODO: POST /api/sessions/{sessionId}/end 구현 시 연결
    cacheSession(roomId, { status: 'FINISHED' });
    return ok();
  },
};
