/**
 * ============================================================
 *  lib/api.js — API 호출 레이어
 * ============================================================
 *
 *  ✅ Mock → 실제 API 전환 방법
 *
 *  1. USE_MOCK = false 로 변경
 *  2. API_BASE_URL = '실제 서버 주소' 로 변경
 *
 *  각 함수의 [실제 API] 주석에서 엔드포인트/스펙 확인하세요.
 *
 * ============================================================
 */

import { MOCK_USERS }    from '@/mock/users';
import { MOCK_SESSIONS } from '@/mock/sessions';

// ─────────────────────────────────────────
//  ⚙️  설정 (여기만 바꾸면 됩니다)
// ─────────────────────────────────────────

/** true = Mock 데이터, false = 실제 API */
export const USE_MOCK = false;

/** 실제 백엔드 주소 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';


// ─────────────────────────────────────────
//  Mock 내부 상태
// ─────────────────────────────────────────

const _runtimeUsers    = [...MOCK_USERS];
const _runtimeSessions = [...MOCK_SESSIONS];

const getStoredUser = () => {
  try { return JSON.parse(sessionStorage.getItem('mock_user')); } catch { return null; }
};
const storeUser = (user) => {
  try { sessionStorage.setItem('mock_user', JSON.stringify(user)); } catch {}
};
const clearStoredUser = () => {
  try { sessionStorage.removeItem('mock_user'); } catch {}
};


// ─────────────────────────────────────────
//  공통 헬퍼
// ─────────────────────────────────────────

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

const TOKEN_KEY = 'auth_token';

// 자동로그인 체크 시 localStorage(영구), 아니면 sessionStorage(탭 종료 시 만료)
const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  } catch { return null; }
};

const storeToken = (token, remember = false) => {
  try {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
};

const clearStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
};

const ok    = (data = {}) => ({ success: true, data });
const err   = (msg)       => ({ success: false, error: msg });
const delay = (ms = 350)  => new Promise((r) => setTimeout(r, ms));

const findUser = (username) =>
  _runtimeUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());

const genCode = () =>
  `#${String(Math.floor(1000 + Math.random() * 8999))}-${String(Math.floor(10 + Math.random() * 89))}`;
const genId = (prefix) => `${prefix}-${Date.now()}`;


// ─────────────────────────────────────────
//  🔐 Auth API
// ─────────────────────────────────────────

export const AuthAPI = {

  /**
   * 현재 로그인 유저 조회
   *
   * [실제 API]
   *   GET /auth/me
   *   Response 200: { user: { id, username } }
   *   Response 401: { error: 'Unauthorized' }
   */
  me: async () => {
    if (USE_MOCK) {
      await delay(100);
      const user = getStoredUser();
      if (!user) return err('로그인이 필요합니다');
      return ok(user);
    }
    return apiFetch('/auth/me');
  },

  /**
   * 로그인
   *
   * [실제 API]
   *   POST /auth/login
   *   Body:     { username, password }
   *   Response 200: { user: { id, username } }
   *   Response 401: { error: string }
   *
   * [Mock 계정] test / 1234
   */
  login: async (email, password, remember = false) => {
    if (USE_MOCK) {
      await delay(400);
      const user = _runtimeUsers.find((u) => u.email === email);
      if (!user)                      return err('존재하지 않는 이메일입니다');
      if (user.password !== password) return err('비밀번호가 올바르지 않습니다');
      const tokenResponse = { accessToken: `mock-token-${user.id}`, tokenType: 'Bearer', userId: user.id, nickname: user.nickname };
      storeUser({ id: user.id, nickname: user.nickname });
      storeToken(tokenResponse.accessToken, remember);
      return ok(tokenResponse);
    }
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.data?.accessToken) {
      storeToken(res.data.accessToken, remember);
    }
    return res;
  },

  /**
   * 회원가입
   *
   * [실제 API]
   *   POST /auth/signup
   *   Body:     { username, password }
   *   Response 201: { user: { id, username } }
   *   Response 409: { error: '이미 사용 중인 아이디입니다' }
   *
   * [참고] 닉네임 없음. 배그 닉네임은 방 팀 구성 시 직접 입력.
   */
  signup: async (nickname, password, email) => {
    if (USE_MOCK) {
      await delay(500);
      if (!/^[a-zA-Z0-9_]{2,20}$/.test(nickname))
        return err('닉네임은 영문·숫자·언더스코어 2~20자만 가능합니다');
      if (!password || password.length < 8)
        return err('비밀번호는 최소 8자 이상이어야 합니다');
      if (_runtimeUsers.some((u) => u.nickname === nickname))
        return err('이미 사용 중인 닉네임입니다');
      const newUser = {
        id: genId('user'), nickname, password, email,
        createdAt: new Date().toISOString(),
      };
      _runtimeUsers.push(newUser);
      const tokenResponse = { accessToken: `mock-token-${newUser.id}`, tokenType: 'Bearer', userId: newUser.id, nickname: newUser.nickname };
      storeUser({ id: newUser.id, nickname: newUser.nickname });
      storeToken(tokenResponse.accessToken);
      return ok(tokenResponse);
    }
    const res = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ nickname, email, password }),
    });
    if (res.success && res.data?.accessToken) {
      storeToken(res.data.accessToken);
    }
    return res;
  },

  /**
   * 로그아웃
   *
   * [실제 API]
   *   POST /auth/logout
   *   Response 200: { ok: true }
   */
  logout: async () => {
    if (USE_MOCK) {
      await delay(150);
      clearStoredUser();
      clearStoredToken();
      return ok({});
    }
    return apiFetch('/auth/logout', { method: 'POST' });
  },

  /**
   * 내 프로필 조회 (가입일 등 상세 정보 포함)
   *
   * [실제 API]
   *   GET /auth/profile
   *   Response 200: { user: { id, username, createdAt } }
   */
  getProfile: async () => {
    if (USE_MOCK) {
      await delay(150);
      const stored = getStoredUser();
      if (!stored) return err('로그인이 필요합니다');
      const full = _runtimeUsers.find((u) => u.id === stored.id);
      if (!full) return err('유저를 찾을 수 없습니다');
      return ok({ id: full.id, nickname: full.nickname, email: full.email, createdAt: full.createdAt });
    }
    return apiFetch('/auth/profile');
  },

  /**
   * 비밀번호 변경
   *
   * [실제 API]
   *   PUT /auth/password
   *   Body: { currentPassword, newPassword }
   *   Response 200: { ok: true }
   *   Response 401: { error: '현재 비밀번호가 올바르지 않습니다' }
   */
  changePassword: async (currentPassword, newPassword) => {
    if (USE_MOCK) {
      await delay(400);
      const stored = getStoredUser();
      if (!stored) return err('로그인이 필요합니다');
      const user = _runtimeUsers.find((u) => u.id === stored.id);
      if (!user) return err('유저를 찾을 수 없습니다');
      if (user.password !== currentPassword) return err('현재 비밀번호가 올바르지 않습니다');
      if (!newPassword || newPassword.length < 8) return err('새 비밀번호는 최소 8자 이상이어야 합니다');
      user.password = newPassword;
      return ok({});
    }
    return apiFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /**
   * 아이디 중복 확인
   *
   * [실제 API]
   *   GET /auth/check-username?username={username}
   *   Response 200: { available: true }
   *   Response 409: { error: '이미 사용 중인 아이디입니다' }
   */
  checkUsername: async (nickname) => {
    if (USE_MOCK) {
      await delay(300);
      if (!/^[a-zA-Z0-9_]{2,20}$/.test(nickname))
        return err('영문·숫자·언더스코어만 사용 가능 (2~20자)');
      if (_runtimeUsers.some((u) => u.nickname === nickname))
        return err('이미 사용 중인 닉네임입니다');
      return ok({ data: { available: true } });
    }
    return apiFetch(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
  },
};


// ─────────────────────────────────────────
//  🏠 Session API (킬내기 방)
// ─────────────────────────────────────────

export const SessionAPI = {

  /**
   * 내 방 목록 조회
   *
   * [실제 API]
   *   GET /sessions
   *   Response 200: { sessions: [{ id, title, code, status, createdAt, teams }] }
   */
  list: async () => {
    if (USE_MOCK) {
      await delay(300);
      const user = getStoredUser();
      const sessions = _runtimeSessions
        .filter((s) => s.hostId === (user?.id || 'user-001'))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return ok(sessions);
    }
    return apiFetch('/api/sessions/my');
  },

  /**
   * 방 생성
   *
   * [실제 API]
   *   POST /sessions
   *   Body: { title, rule, teams }
   *   Response 201: { session: { id, title, code, status, rule, teams, createdAt } }
   *
   * [teams 구조]
   *   [{ id, name, players: [{ id, nick }] }, ...]
   *   players.nick = 배그 인게임 닉네임 (계정 연동 없음)
   */
  create: async ({ title, rule, teams }) => {
    if (USE_MOCK) {
      await delay(400);
      const user = getStoredUser();
      const session = {
        id: genId('session'),
        title,
        code: genCode(),
        status: 'WAITING',
        hostId: user?.id || 'user-001',
        rule,
        teams,
        createdAt: new Date().toISOString(),
      };
      _runtimeSessions.push(session);
      return ok(session);
    }
    return apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, rule, teams }),
    });
  },

  /**
   * 방 정보 업데이트
   *
   * [실제 API]
   *   PUT /sessions/:id
   *   Body: { rule?, teams?, status? }
   *   Response 200: { session }
   */
  update: async (id, data) => {
    if (USE_MOCK) {
      await delay(200);
      const idx = _runtimeSessions.findIndex((s) => s.id === id);
      if (idx !== -1) _runtimeSessions[idx] = { ..._runtimeSessions[idx], ...data };
      return ok(_runtimeSessions[idx]);
    }
    return apiFetch(`/api/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
