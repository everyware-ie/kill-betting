/**
 * ============================================================
 *  lib/room-api.js — 방(Session) 관련 API
 * ============================================================
 */

import { USE_MOCK } from '@/lib/api';
import { createDefaultTeams, DEFAULT_RULE, MAX_PLAYERS_PER_TEAM, _runtimeRooms } from '@/mock/rooms';

const ok = (data = {}) => ({ ok: true, ...data });
const err = (msg) => ({ ok: false, error: msg });
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const TEAM_NAMES = ['TEAM ALPHA', 'TEAM BRAVO', 'TEAM CHARLIE', 'TEAM DELTA', 'TEAM ECHO', 'TEAM FOXTROT'];

const getToken = () => {
  try { return localStorage.getItem('kc_token'); } catch { return null; }
};

async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    return err('서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.');
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return err(json.message || `요청 실패 (${res.status})`);
  if (json.success === false) return err(json.message || '서버 오류가 발생했습니다');
  return ok(json.data !== undefined ? (json.data || {}) : json);
}

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

function buildRoomFromBackend(configure, cachedMeta = {}) {
  const hostNickname = cachedMeta.hostNickname || null;

  const teams = (configure.teams || []).map((t) => {
    const leaderUserId = t.leaderUserId ?? t.operatorUserId;
    const leaderNickname = t.leaderNickname ?? t.operatorNickname;
    const players = (t.players || []).map((p) => p.playerNickname);
    const _playerIds = Object.fromEntries((t.players || []).map((p) => [p.playerNickname, p.playerId]));
    const members = leaderUserId
      ? [{
          userId: String(leaderUserId),
          username: leaderNickname,
          role: 'LEADER',
        }]
      : [];

    return {
      id: String(t.teamId),
      name: t.teamName,
      status: t.status,
      members,
      players,
      _playerIds,
    };
  });

  const participants = (configure.waitingUsers || []).map((u) => ({
    userId: String(u.userId),
    username: u.nickname,
    role: u.nickname === hostNickname ? 'HOST' : 'MEMBER',
    joinedAt: new Date().toISOString(),
  }));

  teams.forEach((team) => {
    team.members.forEach((member) => {
      if (!participants.some((p) => p.userId === member.userId)) {
        participants.push({
          userId: member.userId,
          username: member.username,
          role: member.username === hostNickname ? 'HOST' : 'MEMBER',
          joinedAt: new Date().toISOString(),
        });
      }
    });
  });

  return {
    id: String(configure.sessionId),
    title: cachedMeta.title || `킬내기 #${configure.sessionId}`,
    code: cachedMeta.code || String(configure.sessionId),
    status: cachedMeta.status || 'WAITING',
    rule: cachedMeta.rule || DEFAULT_RULE,
    hostNickname,
    teams,
    participants,
  };
}

function buildCreateRequest(title, rule) {
  const rules = [];
  if (rule?.chickenBonusOn) rules.push({ ruleType: 'CHICKEN_BONUS', operator: 'GTE', value: rule.chickenBonus });
  if (rule?.deathPenaltyOn) rules.push({ ruleType: 'SURVIVAL_PENALTY', operator: 'GTE', value: rule.deathPenalty });
  if (rule?.teamKillPenaltyOn) rules.push({ ruleType: 'CONSECUTIVE_DEATH_PENALTY', operator: 'GTE', value: rule.teamKillPenalty });

  return {
    name: title,
    targetKills: rule?.targetKills || 20,
    timeLimitMinutes: rule?.timeLimitMin || rule?.timeLimit || 60,
    rules,
  };
}

function buildMatchesFromBackend(scoreboard, matchHistory) {
  const teams = scoreboard?.teams || [];

  const scoreMatches = teams.map((team) => ({
    id: `score-${team.teamId}`,
    teamId: String(team.teamId),
    matchNumber: 0,
    isScoreboard: true,
    results: (team.members || []).map((member) => ({
      playerId: String(member.playerId),
      playerName: member.playerNickname,
      kills: member.totalKills,
      bonusKills: member.bonusKills,
      penaltyKills: member.penaltyKills,
      effectiveKills: member.effectiveKills,
    })),
    adjustedScore: team.effectiveKills,
  }));

  const historyMatches = (matchHistory?.matches || []).flatMap((match) => {
    const teamIds = [...new Set((match.memberResults || []).map((result) => result.teamId))];
    return teamIds.map((teamId) => ({
      id: `${match.matchId}-${teamId}`,
      matchId: match.matchId,
      teamId: String(teamId),
      matchNumber: match.matchNumber,
      mapName: match.mapName,
      playedAt: match.playedAt,
      results: (match.memberResults || [])
        .filter((result) => result.teamId === teamId)
        .map((result) => ({
          playerId: String(result.playerId),
          playerName: result.playerNickname,
          kills: result.kills,
          bonusKills: result.bonusKills,
          penaltyKills: result.penaltyKills,
          effectiveKills: result.effectiveKills,
          placement: result.placement,
          isChicken: result.isChicken,
        })),
    }));
  });

  return [...scoreMatches, ...historyMatches];
}

async function getFreshTeams(roomId) {
  const configRes = await apiFetch(`/api/sessions/${roomId}/configure`);
  if (!configRes.ok) return configRes;
  const cachedMeta = getCachedSession(roomId) || {};
  const room = buildRoomFromBackend({ sessionId: roomId, ...configRes }, cachedMeta);
  return ok({ teams: room.teams, room });
}

export const RoomAPI = {
  list: async (userId) => {
    if (USE_MOCK) {
      await delay(200);
      const rooms = _runtimeRooms
        .filter((room) => room.participants?.some((p) => p.userId === userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return ok({ rooms });
    }

    const res = await apiFetch('/api/sessions/my');
    if (!res.ok) return res;
    const sessions = Array.isArray(res) ? res : (res.sessions || []);
    const rooms = sessions.map((session) => {
      const cached = getCachedSession(session.id) || {};
      return {
        id: String(session.id),
        title: session.name,
        code: session.roomUrl,
        status: session.status,
        createdAt: session.createdAt,
        rule: cached.rule || DEFAULT_RULE,
        teams: [],
      };
    });
    return ok({ rooms });
  },

  create: async (title, rule, hostUser) => {
    const hostUserId = typeof hostUser === 'object' ? hostUser.id : hostUser;
    const hostUsername = typeof hostUser === 'object' ? hostUser.username : hostUser;

    if (USE_MOCK) {
      await delay(400);
      if (!title.trim()) return err('방 제목을 입력해주세요');
      const room = {
        id: `room-${Date.now()}`,
        title: title.trim(),
        code: `#${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
        status: 'WAITING',
        rule: { ...DEFAULT_RULE, ...rule },
        teams: createDefaultTeams(),
        participants: [{ userId: hostUserId, username: hostUsername, role: 'HOST', joinedAt: new Date().toISOString() }],
        hostNickname: hostUsername,
        createdAt: new Date().toISOString(),
      };
      _runtimeRooms.push(room);
      return ok({ room });
    }

    const res = await apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(buildCreateRequest(title, rule)),
    });
    if (!res.ok) return res;

    const sessionId = String(res.id);
    await apiFetch(`/api/sessions/${sessionId}/join`, { method: 'POST' });

    await apiFetch(`/api/sessions/${sessionId}/teams`, {
      method: 'POST',
      body: JSON.stringify({ name: 'TEAM ALPHA' }),
    });
    await apiFetch(`/api/sessions/${sessionId}/teams`, {
      method: 'POST',
      body: JSON.stringify({ name: 'TEAM BRAVO' }),
    });

    cacheSession(sessionId, {
      id: sessionId,
      title: res.name || title,
      code: res.roomUrl,
      status: res.status,
      rule,
      hostNickname: hostUsername,
      hostUserId,
      createdAt: res.createdAt,
    });

    const fresh = await getFreshTeams(sessionId);
    const room = fresh.room || {
      id: sessionId,
      title: res.name || title,
      code: res.roomUrl,
      status: res.status,
      rule,
      hostNickname: hostUsername,
      teams: [],
      participants: [{ userId: hostUserId, username: hostUsername, role: 'HOST', joinedAt: new Date().toISOString() }],
    };
    return ok({ room });
  },

  get: async (roomId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ room });
    }

    const configRes = await apiFetch(`/api/sessions/${roomId}/configure`);
    if (!configRes.ok) return configRes;
    const room = buildRoomFromBackend({ sessionId: roomId, ...configRes }, getCachedSession(roomId) || {});
    return ok({ room });
  },

  joinByCode: async (code, user) => {
    if (USE_MOCK) {
      await delay(300);
      const normalized = code.trim().startsWith('#') ? code.trim().toUpperCase() : `#${code.trim().toUpperCase()}`;
      const room = _runtimeRooms.find((r) => r.code === normalized);
      if (!room) return err('초대 코드를 찾을 수 없습니다');
      if (room.status === 'DONE') return err('이미 종료된 방입니다');
      if (!room.participants.some((p) => p.userId === user?.id)) {
        room.participants.push({ userId: user.id, username: user.username, role: 'MEMBER', joinedAt: new Date().toISOString() });
      }
      return ok({ roomId: room.id });
    }

    const sessionRes = await apiFetch(`/api/sessions/join/${encodeURIComponent(code)}`);
    if (!sessionRes.ok) return sessionRes;

    const sessionId = String(sessionRes.id);
    const joinRes = await apiFetch(`/api/sessions/${sessionId}/join`, { method: 'POST' });
    if (!joinRes.ok) return joinRes;

    cacheSession(sessionId, {
      id: sessionId,
      title: sessionRes.name,
      code: sessionRes.roomUrl || code,
      status: sessionRes.status,
      hostNickname: sessionRes.hostNickname,
      rule: DEFAULT_RULE,
      createdAt: sessionRes.createdAt,
    });

    return ok({ roomId: sessionId });
  },

  joinTeam: async (roomId, teamId, user) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const targetTeam = room.teams.find((team) => team.id === teamId);
      const alreadyOccupied = (targetTeam?.members || []).some((member) => member.userId !== user.id);
      if (alreadyOccupied) return err('이미 다른 팀원이 있는 팀입니다');
      room.teams = room.teams.map((team) => ({
        ...team,
        members: (team.members || []).filter((member) => member.userId !== user.id),
      }));
      room.teams = room.teams.map((team) => (
        team.id === teamId
          ? { ...team, members: [{ userId: user.id, username: user.username, role: 'LEADER' }] }
          : team
      ));
      return ok({ teams: room.teams });
    }

    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/leader`, {
      method: 'PUT',
      body: JSON.stringify({ userId: Number(user.id) }),
    });
    if (!res.ok) return res;
    return getFreshTeams(roomId);
  },

  leaveTeam: async (roomId, teamId, userId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.teams = room.teams.map((team) => (
        team.id === teamId
          ? { ...team, members: (team.members || []).filter((member) => member.userId !== userId) }
          : team
      ));
      return ok({ teams: room.teams });
    }

    return err('현재 백엔드에 팀 리더 해제 API가 없습니다.');
  },

  setLeader: async (roomId, teamId, newLeaderUserId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.teams = room.teams.map((team) => (
        team.id === teamId
          ? { ...team, members: [{ userId: newLeaderUserId, username: '', role: 'LEADER' }] }
          : team
      ));
      return ok({ teams: room.teams });
    }

    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/leader`, {
      method: 'PUT',
      body: JSON.stringify({ userId: Number(newLeaderUserId) }),
    });
    if (!res.ok) return res;
    return getFreshTeams(roomId);
  },

  addTeam: async (roomId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      if (room.teams.length >= 6) return err('최대 6팀까지 가능합니다');
      room.teams.push({ id: `team-${Date.now()}`, name: TEAM_NAMES[room.teams.length] || `TEAM ${room.teams.length + 1}`, players: [], members: [] });
      return ok({ teams: room.teams });
    }

    const current = await apiFetch(`/api/sessions/${roomId}/configure`);
    const teamName = TEAM_NAMES[(current.teams || []).length] || `TEAM ${(current.teams || []).length + 1}`;
    const res = await apiFetch(`/api/sessions/${roomId}/teams`, {
      method: 'POST',
      body: JSON.stringify({ name: teamName }),
    });
    if (!res.ok) return res;
    return getFreshTeams(roomId);
  },

  removeTeam: async () => err('현재 백엔드에 팀 삭제 API가 없습니다.'),

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

    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/players`, {
      method: 'POST',
      body: JSON.stringify({ playerNickname: nickname }),
    });
    return res.ok ? ok() : res;
  },

  removePlayer: async (roomId, teamId, nickname, playerId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const team = room.teams.find((t) => t.id === teamId);
      if (!team) return err('팀을 찾을 수 없습니다');
      team.players = team.players.filter((player) => player !== nickname);
      return ok();
    }

    let pid = playerId;
    if (!pid) {
      const configRes = await apiFetch(`/api/sessions/${roomId}/configure`);
      const backendTeam = (configRes.teams || []).find((team) => String(team.teamId) === String(teamId));
      const player = (backendTeam?.players || []).find((p) => p.playerNickname === nickname);
      pid = player?.playerId;
    }
    if (!pid) return err('플레이어 ID를 찾을 수 없습니다');

    const res = await apiFetch(`/api/sessions/${roomId}/teams/${teamId}/players/${pid}`, { method: 'DELETE' });
    return res.ok ? ok() : res;
  },

  updateTeams: async (roomId, nextTeams) => {
    if (USE_MOCK) {
      await delay(250);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.teams = nextTeams;
      return ok({ teams: nextTeams });
    }

    const current = await getFreshTeams(roomId);
    if (!current.ok) return current;

    for (const nextTeam of nextTeams) {
      const prevTeam = current.teams.find((team) => team.id === nextTeam.id);
      if (!prevTeam) continue;

      const added = (nextTeam.players || []).filter((nick) => !(prevTeam.players || []).includes(nick));
      const removed = (prevTeam.players || []).filter((nick) => !(nextTeam.players || []).includes(nick));

      for (const nick of added) {
        const res = await RoomAPI.addPlayer(roomId, nextTeam.id, nick);
        if (!res.ok) return res;
      }
      for (const nick of removed) {
        const res = await RoomAPI.removePlayer(roomId, nextTeam.id, nick, prevTeam._playerIds?.[nick]);
        if (!res.ok) return res;
      }
    }

    return getFreshTeams(roomId);
  },

  updateRule: async (roomId, rule) => {
    cacheSession(roomId, { rule });
    return ok({ rule });
  },

  start: async (roomId) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const emptyTeam = room.teams.find((team) => team.players.length === 0);
      if (emptyTeam) return err(`${emptyTeam.name}에 플레이어를 추가해주세요`);
      room.status = 'LIVE';
      return ok({ room });
    }

    const res = await apiFetch(`/api/sessions/${roomId}/start`, { method: 'POST' });
    if (!res.ok) return res;
    cacheSession(roomId, { status: 'LIVE' });
    return ok();
  },

  getMatches: async (roomId) => {
    if (USE_MOCK) {
      await delay(150);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ matches: room.matches || [] });
    }

    const [scoreboard, matchHistory] = await Promise.all([
      apiFetch(`/api/sessions/${roomId}/scoreboard`),
      apiFetch(`/api/sessions/${roomId}/match-history`),
    ]);
    if (!scoreboard.ok) return scoreboard;
    if (!matchHistory.ok) return matchHistory;
    return ok({ matches: buildMatchesFromBackend(scoreboard, matchHistory) });
  },

  addTeamMatch: async (roomId, teamId, results, claimsChicken) => {
    if (USE_MOCK) {
      await delay(250);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      if (!room.matches) room.matches = [];
      const match = {
        id: `match-${Date.now()}`,
        teamId,
        teamMatchNumber: room.matches.filter((m) => m.teamId === teamId).length + 1,
        results: [...results],
        chickenTeamId: claimsChicken ? teamId : null,
        createdAt: new Date().toISOString(),
      };
      room.matches.push(match);
      return ok({ match });
    }

    return err('실제 API에서는 매치 결과가 이미지 업로드 OCR 흐름으로 생성됩니다.');
  },

  uploadMatchScreenshot: async (roomId, matchId, file) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const match = room.matches?.find((m) => m.id === matchId);
      if (!match) return err('매치를 찾을 수 없습니다');
      const screenshotUrl = URL.createObjectURL(file);
      match.screenshotUrl = screenshotUrl;
      return ok({ screenshotUrl });
    }

    const formData = new FormData();
    formData.append('image', file);
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/sessions/${roomId}/matches`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return err(json.message || `요청 실패 (${res.status})`);
    }
    const json = await res.json().catch(() => ({}));
    return ok({ screenshotUrl: json.data?.screenshotUrl || json.screenshotUrl, match: json.data || json });
  },

  addAdjustment: async () => ok({ adjustments: [] }),
  end: async () => ok(),
  getParticipants: async (roomId) => {
    const res = await RoomAPI.get(roomId);
    return res.ok ? ok({ participants: res.room.participants || [] }) : res;
  },
};
