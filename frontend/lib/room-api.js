/**
 * ============================================================
 *  lib/room-api.js — 킬내기 방 API 레이어
 * ============================================================
 *
 *  [백엔드 개발자 가이드]
 *
 *  USE_MOCK = false 로 변경하면 실제 API 호출로 전환됩니다.
 *  (lib/api.js 와 동일한 방식)
 *
 *  [개념 정리]
 *
 *  team.players       → 배그 닉네임 문자열 목록 (계정 연동 없음)
 *
 * ============================================================
 */

import { USE_MOCK } from '@/lib/api';
import {
  _runtimeRooms,
  createDefaultTeams,
  DEFAULT_RULE,
} from '@/mock/rooms';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  return res.json().catch(() => ({}));
}

const getStoredToken = () => {
  try { return sessionStorage.getItem('auth_token'); } catch { return null; }
};

const ok    = (data = {}) => ({ success: true, data });
const err   = (msg)       => ({ success: false, error: msg });
const delay = (ms = 300)  => new Promise((r) => setTimeout(r, ms));

/** 방 코드 생성 (예: #1234-56) */
const genCode = () =>
  `#${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`;

/**
 * 프론트엔드 rule 객체를 백엔드 RuleRequest[] 형식으로 변환
 * 백엔드 RuleType: CHICKEN_BONUS, SURVIVAL_PENALTY만 지원
 * 프론트: { chickenBonusOn: true, chickenBonus: 5, survivalPenaltyOn: true, survivalPenalty: 2 }
 * 백엔드: [{ ruleType: 'CHICKEN_BONUS', operator: 'PLUS', value: 5 }, ...]
 */
const convertRuleToBackend = (rule) => {
  const rules = [];

  if (rule.chickenBonusOn && rule.chickenBonus > 0) {
    rules.push({ ruleType: 'CHICKEN_BONUS', operator: 'PLUS', value: rule.chickenBonus });
  }
  if (rule.survivalPenaltyOn && rule.survivalPenalty > 0) {
    rules.push({ ruleType: 'SURVIVAL_PENALTY', operator: 'MINUS', value: rule.survivalPenalty });
  }

  return rules;
};

export const RoomAPI = {

  /**
   * 방 생성
   *
   * [실제 API]
   *   POST /sessions
   *   Body: { name, targetKills, timeLimitMinutes, rules }
   *   Response 201: { session: SessionResponse }
   *
   * [백엔드 요구 필드]
   *   name: 세션 이름 (required)
   *   targetKills: 목표 킬 수
   *   timeLimitMinutes: 제한 시간 (분) - null이면 제한 없음
   *   rules: [{ ruleType, operator, value }]
   */
  create: async (title, rule, hostUser) => {
    const hostUserId = typeof hostUser === 'object' ? hostUser.id : hostUser;
    const hostUsername = typeof hostUser === 'object' ? hostUser.username : hostUser;
    if (USE_MOCK) {
      await delay(400);
      if (!title.trim()) return err('방 제목을 입력해주세요');
      const room = {
        id:           `room-${Date.now()}`,
        title:        title.trim(),
        code:         genCode(),
        status:       'WAITING',
        rule:         { ...DEFAULT_RULE, ...rule },
        teams:        createDefaultTeams(),
        hostUserId,
        createdAt:    new Date().toISOString(),
      };
      _runtimeRooms.push(room);
      return ok({ room });
    }
    return apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        name: title.trim(),
        targetKills: rule.targetKills,
        timeLimitMinutes: rule.noTimeLimit ? null : rule.timeLimitMin,
        rules: convertRuleToBackend(rule),
      }),
    });
  },

  /**
   * 방 조회
   *
   * [실제 API]
   *   GET /sessions/join/{roomUrl}
   *   Response 200: { session }
   *   Response 404: { error: '방을 찾을 수 없습니다' }
   */
  get: async (roomCode) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomCode || r.code === roomCode);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ room });
    }
    return apiFetch(`/sessions/join/${roomCode}`);
  },

  updateRule: async (sessionId, rule) => {
    if (USE_MOCK) {
      await delay(250);
      const room = _runtimeRooms.find((r) => r.id === sessionId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.rule = { ...rule };
      return ok({ rule });
    }
    const updates = [
      { ruleId: rule.chickenBonusRuleId, value: rule.chickenBonusOn ? rule.chickenBonus : 0 },
      { ruleId: rule.survivalPenaltyRuleId, value: rule.survivalPenaltyOn ? rule.survivalPenalty : 0 },
    ].filter((u) => u.ruleId != null);

    for (const { ruleId, value } of updates) {
      const res = await apiFetch(`/sessions/${sessionId}/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      if (!res.success) return res;
    }
    return ok({ rule });
  },

  /**
   * 매치 이미지 업로드 → 매치 생성 (PENDING) + OCR 결과 반환
   *
   * [실제 API]
   *   POST /sessions/:sessionId/matches
   *   Body: FormData { image: File }
   *   Response 201: { matchId, screenshotUrl, ocrResult }
   */
  uploadMatchImage: async (sessionId, imageFile) => {
    if (USE_MOCK) {
      await delay(250);
      return ok({ matchId: `match-${Date.now()}`, screenshotUrl: '', ocrResult: null });
    }
    const formData = new FormData();
    formData.append('image', imageFile);
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/matches`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });
    return res.json().catch(() => ({}));
  },

  /**
   * 매치 목록 조회
   *
   * [실제 API]
   *   GET /sessions/:sessionId/match-history
   *   Response 200: { matches: Match[] }
   *
   * [반환 데이터]
   *   각 match: { id, teamId, teamMatchNumber, results, chickenTeamId, createdAt }
   *   팀별로 독립 제출되므로 teamId로 필터링하면 해당 팀의 히스토리를 볼 수 있음
   */
  getMatches: async (roomId) => {
    if (USE_MOCK) {
      await delay(150);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ matches: room.matches || [] });
    }
    return apiFetch(`/sessions/${roomId}/match-history`);
  },

  /**
   * 매치 결과 확정
   *
   * [실제 API]
   *   POST /matches/:matchId/confirm
   *   Body: { mapName, placement, playTime, playerResults[], isChicken }
   *   Response 200: { matchId, status }
   */
  confirmMatch: async (matchId, { playerResults, isChicken, mapName, placement, playTime }) => {
    if (USE_MOCK) {
      await delay(200);
      return ok({ matchId, status: 'CONFIRMED' });
    }
    return apiFetch(`/matches/${matchId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ mapName: mapName || '', placement: placement || 0, playTime: playTime || '', playerResults, isChicken }),
    });
  },

  addAdjustment: async (sessionId, teamId, amount, reason) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === sessionId);
      if (!room) return err('방을 찾을 수 없습니다');
      if (!room.adjustments) room.adjustments = [];
      const adj = { id: `adj-${Date.now()}`, teamId, amount, reason, createdAt: new Date().toISOString() };
      room.adjustments.push(adj);
      return ok({ adjustments: room.adjustments });
    }
    return apiFetch(`/sessions/${sessionId}/teams/${teamId}/adjustments`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },

  // TODO: 백엔드 미구현 상태 — 추후 구현 예정
  end: async (sessionId) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === sessionId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.status = 'DONE';
      room.endedAt = new Date().toISOString();
      return ok({ room });
    }
    return apiFetch(`/sessions/${sessionId}/end`, { method: 'POST' });
  },

  /**
   * 스코어보드 조회
   *
   * [실제 API]
   *   GET /sessions/:sessionId/scoreboard
   *   Response 200: { sessionId, sessionName, status, winnerTeamId, winnerTeamName, isDraw, teams[] }
   */
  getScoreboard: async (sessionId) => {
    if (USE_MOCK) {
      await delay(150);
      const room = _runtimeRooms.find((r) => r.id === sessionId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ teams: [] });
    }
    return apiFetch(`/sessions/${sessionId}/scoreboard`);
  },

  /**
   * 팀 목록 조회
   *
   * [실제 API]
   *   GET /sessions/:sessionId/teams
   *   Response 200: { success, data: TeamResponse[] }
   */
  getTeams: async (sessionId) => {
    if (USE_MOCK) {
      await delay(150);
      const room = _runtimeRooms.find((r) => r.id === sessionId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok(room.teams || []);
    }
    return apiFetch(`/sessions/${sessionId}/teams`);
  },

  /**
   * 내 방 목록 조회
   *
   * [실제 API]
   *   GET /sessions/my
   *   Response 200: { sessions: SessionResponse[] }
   *
   * [반환 데이터]
   *   sessions 배열 — 각 방의 id, title, status, createdAt, teams, rule 포함
   *   status: 'WAITING' | 'LIVE' | 'DONE'
   */
  list: async (userId) => {
    if (USE_MOCK) {
      await delay(200);
      const myRooms = _runtimeRooms.filter((r) =>
        r.hostUserId === userId
      );
      // 최신순 정렬
      const sorted = [...myRooms].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      return ok({ rooms: sorted });
    }
    return apiFetch(`/sessions/my`);
  },

  /**
   * 초대 코드로 방 참여
   *
   * [실제 API]
   *   GET /sessions/join/{roomUrl}  (세션 정보 조회)
   *   POST /sessions/{sessionId}/join  (세션에 입장)
   *   Response 200: { session }
   *   Response 404: { error: '초대 코드를 찾을 수 없습니다' }
   *   Response 410: { error: '이미 종료된 방입니다' }
   *
   * [동작]
   *   - # 접두어 유무에 관계없이 코드 정규화 후 검색
   *   - 이미 참여 중이면 에러 없이 방 정보만 반환 (멱등성)
   *   - DONE 방은 참여 불가
   */
  joinByCode: async (code, user) => {
    if (USE_MOCK) {
      await delay(400);
      // '#' 접두어 정규화 (있으면 유지, 없으면 추가)
      const normalized = code.trim().startsWith('#')
        ? code.trim().toUpperCase()
        : `#${code.trim().toUpperCase()}`;

      const room = _runtimeRooms.find((r) => r.code === normalized);
      if (!room) return err('초대 코드를 찾을 수 없습니다');
      if (room.status === 'DONE') return err('이미 종료된 방입니다');

      return ok({ room });
    }
    const cleaned = code.replace(/^#/, '').trim().toUpperCase();
    return apiFetch(`/sessions/join/${cleaned}`);
  },

  /**
   * 킬내기 시작
   *
   * [실제 API]
   *   POST /sessions/:sessionId/start
   *   Response 200: { ok }
   *
   * [조건] 각 팀에 최소 1명 이상의 플레이어가 있어야 함
   */
  start: async (roomId) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const emptyTeam = room.teams.find((t) => t.players.length === 0);
      if (emptyTeam) return err(`${emptyTeam.name}에 플레이어를 추가해주세요`);
      room.status = 'LIVE';
      return ok({ room });
    }
    return apiFetch(`/sessions/${roomId}/start`, { method: 'POST' });
  },
};
