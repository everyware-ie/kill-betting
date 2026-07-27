/**
 * ============================================================
 *  lib/admin-api.js — 어드민 지표 대시보드 API 레이어
 * ============================================================
 *
 *  USE_MOCK = true 이면 목 데이터를 반환한다 (lib/api.js 와 동일 방식).
 *  실제 응답은 백엔드 ApiResponse({ success, data }) 형식을 그대로 사용한다.
 *
 *  주의: API_BASE_URL(NEXT_PUBLIC_API_URL)에 이미 /api 가 포함되므로
 *        path 에는 /api 를 붙이지 않는다.
 * ============================================================
 */

import { USE_MOCK } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const getStoredToken = () => {
  try {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
  } catch {
    return null;
  }
};

const ok = (data = {}) => ({ success: true, data });
const err = (msg, extra = {}) => ({ success: false, error: msg, ...extra });
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const AdminAPI = {
  /**
   * 운영 지표 조회
   *   GET /api/admin/metrics
   *   Response 200: { totalUsers, newUsers7d, newUsers30d, totalSessions,
   *                    sessionsByStatus, avgParticipantsPerSession,
   *                    avgSessionsPerUser, activeUsers7d, activeUsers30d,
   *                    w1RetentionRate }
   *   Response 403: 어드민 화이트리스트 밖
   */
  getMetrics: async () => {
    if (USE_MOCK) {
      await delay();
      return ok({
        totalUsers: 42,
        newUsers7d: 5,
        newUsers30d: 18,
        totalSessions: 27,
        sessionsByStatus: { WAITING: 3, IN_PROGRESS: 4, ENDED: 20 },
        avgParticipantsPerSession: 3.7,
        avgSessionsPerUser: 1.85,
        activeUsers7d: 12,
        activeUsers30d: 29,
        w1RetentionRate: 41.67,
      });
    }

    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/admin/metrics`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.status === 401 || res.status === 403) {
        return err('접근 권한이 없습니다.', { forbidden: true });
      }

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        return err(body.message || '지표를 불러오지 못했습니다.');
      }
      return ok(body.data);
    } catch {
      return err('지표를 불러오지 못했습니다.');
    }
  },

  /**
   * 어드민 세션 목록 (페이징 + 상태 필터)
   *   GET /api/admin/sessions?status&page&size
   *   Response 200: Page<AdminSessionSummaryResponse>
   */
  getSessions: async ({ status = null, page = 0, size = 20 } = {}) => {
    if (USE_MOCK) {
      await delay();
      const all = MOCK_SESSIONS.filter((s) => !status || s.status === status);
      return ok({
        content: all.slice(page * size, page * size + size),
        totalElements: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / size)),
        number: page,
        size,
      });
    }

    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);
    return adminGet(`/admin/sessions?${query.toString()}`, '세션 목록을 불러오지 못했습니다.');
  },

  /**
   * 어드민 세션 상세
   *   GET /api/admin/sessions/{sessionId}
   *   Response 200: AdminSessionDetailResponse, 404: 없는 세션
   */
  getSessionDetail: async (sessionId) => {
    if (USE_MOCK) {
      await delay();
      return ok(MOCK_SESSION_DETAIL(sessionId));
    }
    return adminGet(`/admin/sessions/${sessionId}`, '세션 상세를 불러오지 못했습니다.');
  },
};

/** 어드민 GET 공통 처리: 401/403 → forbidden, 실패 → error, 성공 → data */
async function adminGet(path, errMsg) {
  try {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
      return err('접근 권한이 없습니다.', { forbidden: true });
    }
    if (res.status === 404) {
      return err('세션을 찾을 수 없습니다.', { notFound: true });
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      return err(body.message || errMsg);
    }
    return ok(body.data);
  } catch {
    return err(errMsg);
  }
}

const MOCK_SESSIONS = [
  { id: 3, name: '금요일 킬내기', hostNickname: '전차', status: 'IN_PROGRESS', roomCode: 'AB12CD', createdAt: '2026-07-20T21:00:00', participantCount: 8 },
  { id: 2, name: '주말 스크림', hostNickname: '나기', status: 'ENDED', roomCode: 'ZZ99XX', createdAt: '2026-07-18T13:30:00', participantCount: 12 },
  { id: 1, name: '테스트 세션', hostNickname: '호스트', status: 'WAITING', roomCode: 'QW3RTY', createdAt: '2026-07-15T09:00:00', participantCount: 3 },
];

const MOCK_SESSION_DETAIL = (sessionId) => {
  const meta = MOCK_SESSIONS.find((s) => String(s.id) === String(sessionId)) || MOCK_SESSIONS[0];
  return {
    meta: {
      id: meta.id, name: meta.name, hostNickname: meta.hostNickname, status: meta.status,
      roomCode: meta.roomCode, targetKills: 50, timeLimitMinutes: 60,
      createdAt: meta.createdAt, startedAt: null, endedAt: null,
    },
    teams: [
      { id: 1, name: '팀 알파', leaderUserId: 1, effectiveKills: 14, players: ['foo', 'bar'], members: [{ userId: 1, username: 'foo', role: 'LEADER' }, { userId: 2, username: 'bar', role: 'MEMBER' }] },
      { id: 2, name: '팀 브라보', leaderUserId: 3, effectiveKills: 9, players: ['baz'], members: [{ userId: 3, username: 'baz', role: 'LEADER' }] },
    ],
    matchHistory: { sessionId: meta.id, sessionName: meta.name, confirmedMatchCount: 2, matches: [
      { matchId: 1, matchNumber: 1, mapName: 'Erangel', screenshotUrl: null, playedAt: meta.createdAt, memberResults: [] },
      { matchId: 2, matchNumber: 2, mapName: 'Miramar', screenshotUrl: null, playedAt: meta.createdAt, memberResults: [] },
    ] },
    scoreboard: { sessionId: meta.id, sessionName: meta.name, status: meta.status, winnerTeamId: 1, winnerTeamName: '팀 알파', isDraw: false, teams: [
      { teamId: 1, teamName: '팀 알파', leaderUserId: 1, totalKills: 14, ruleScore: 5, adjustmentScore: 0, effectiveKills: 14, members: [] },
      { teamId: 2, teamName: '팀 브라보', leaderUserId: 3, totalKills: 9, ruleScore: 2, adjustmentScore: 0, effectiveKills: 9, members: [] },
    ] },
  };
};
