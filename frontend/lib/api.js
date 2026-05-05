/**
 * ============================================================
 *  lib/api.js — API 호출 레이어
 * ============================================================
 *
 *  ✅ Mock → 실제 API 전환 방법
 *
 *  1. USE_MOCK = false 로 변경
 *  2. .env.local 에 NEXT_PUBLIC_API_URL=http://localhost:8080 추가
 *
 *  [실제 API 공통 규칙]
 *   - 모든 경로는 /api/ 로 시작
 *   - 인증이 필요한 엔드포인트: Authorization: Bearer {JWT} 헤더 전송
 *   - 응답 형식: { success, message, data } (ApiResponse<T>)
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

/** 실제 백엔드 주소 (로컬: http://localhost:8080) */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


// ─────────────────────────────────────────
//  JWT 토큰 관리
// ─────────────────────────────────────────

export const getToken  = () => { try { return localStorage.getItem('kc_token'); }  catch { return null; } };
const storeToken       = (t) => { try { localStorage.setItem('kc_token', t); }     catch {} };
const clearToken       = ()  => { try { localStorage.removeItem('kc_token'); }      catch {} };


// ─────────────────────────────────────────
//  Mock 내부 상태 (USE_MOCK = true 일 때만 사용)
// ─────────────────────────────────────────

const _runtimeUsers    = [...MOCK_USERS];
const _runtimeSessions = [...MOCK_SESSIONS];

const getStoredUser = () => {
  try { return JSON.parse(sessionStorage.getItem('mock_user')); } catch { return null; }
};
const storeUser  = (u) => { try { sessionStorage.setItem('mock_user', JSON.stringify(u)); } catch {} };
const clearStoredUser = () => { try { sessionStorage.removeItem('mock_user'); }             catch {} };


// ─────────────────────────────────────────
//  공통 헬퍼
// ─────────────────────────────────────────

/**
 * 실제 API 호출
 * - JWT 토큰 자동 첨부
 * - ApiResponse<T> { success, message, data } 자동 언래핑
 * - multipart FormData 전송 시 options.body = FormData (Content-Type 자동)
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();

  // FormData 전송 시 Content-Type 헤더를 설정하지 않음 (브라우저가 boundary 포함해 자동 설정)
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
    return { ok: false, error: '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.' };
  }

  const json = await res.json().catch(() => ({}));

  // HTTP 오류 처리
  if (!res.ok) {
    return { ok: false, error: json.message || `요청 실패 (${res.status})` };
  }

  // ApiResponse 래퍼 언래핑: { success, message, data }
  if (json.success === false) {
    return { ok: false, error: json.message || '서버 오류가 발생했습니다' };
  }

  // data 필드가 있으면 스프레드, 없으면 json 전체 반환
  return { ok: true, ...(json.data !== undefined ? (json.data || {}) : json) };
}

// Mock 헬퍼: { ok } 포맷으로 통일 (apiFetch 반환 포맷과 동일)
const ok    = (data = {}) => ({ ok: true,  ...data });
const err   = (msg)       => ({ ok: false, error: msg });
const delay = (ms = 350)  => new Promise((r) => setTimeout(r, ms));

const findUser = (identifier) =>
  _runtimeUsers.find(
    (u) => u.username.toLowerCase() === identifier.toLowerCase()
      || (u.email && u.email.toLowerCase() === identifier.toLowerCase())
  );

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
   *   GET /api/auth/me
   *   Header: Authorization: Bearer {token}
   *   Response 200: { id, nickname, email, pubgNickname, ... }
   */
  me: async () => {
    if (USE_MOCK) {
      await delay(100);
      const user = getStoredUser();
      if (!user) return err('로그인이 필요합니다');
      return ok(user);
    }
    const token = getToken();
    if (!token) return err('로그인이 필요합니다');
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) return res;
    // nickname → username 으로 매핑 (프론트 user 객체 통일)
    return ok({ user: { id: String(res.id), username: res.nickname, email: res.email } });
  },

  /**
   * 로그인
   *
   * [실제 API]
   *   POST /api/auth/login
   *   Body: { email, password }
   *   Response 200: { accessToken, tokenType, userId, nickname }
   *
   * [Mock] email = 아이디(username) 로 동작 (mock 전용)
   */
  login: async (email, password) => {
    if (USE_MOCK) {
      await delay(400);
      // mock: email 필드에 username 입력도 허용 (유연한 로그인)
      const user = findUser(email);
      if (!user)                      return err('존재하지 않는 계정입니다');
      if (user.password !== password) return err('비밀번호가 올바르지 않습니다');
      const tokenResponse = { accessToken: `mock-token-${user.id}`, tokenType: 'Bearer', userId: user.id, nickname: user.nickname };
      storeUser({ id: user.id, nickname: user.nickname });
      storeToken(tokenResponse.accessToken);
      return ok(tokenResponse);
    }
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return res;
    storeToken(res.accessToken);
    return ok({ user: { id: String(res.userId), username: res.nickname } });
  },

  /**
   * 회원가입
   *
   * [실제 API]
   *   POST /api/auth/signup
   *   Body: { nickname, email, password, pubgNickname? }
   *   Response 201: { accessToken, tokenType, userId, nickname }
   *
   * [Mock] nickname = username 으로 저장
   */
  signup: async (nickname, email, password) => {
    if (USE_MOCK) {
      await delay(500);
      if (!/^[a-zA-Z0-9_]{2,20}$/.test(nickname))
        return err('닉네임은 영문·숫자·언더스코어 2~20자만 가능합니다');
      if (!password || password.length < 8)
        return err('비밀번호는 최소 8자 이상이어야 합니다');
      if (findUser(nickname))
        return err('이미 사용 중인 닉네임입니다');
      const newUser = {
        id: genId('user'), username: nickname, nickname, password,
        email, createdAt: new Date().toISOString(),
      };
      _runtimeUsers.push(newUser);
      const tokenResponse = { accessToken: `mock-token-${newUser.id}`, tokenType: 'Bearer', userId: newUser.id, nickname: newUser.nickname };
      storeUser({ id: newUser.id, nickname: newUser.nickname });
      storeToken(tokenResponse.accessToken);
      return ok(tokenResponse);
    }
    const res = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ nickname, email, password }),
    });
    if (!res.ok) return res;
    storeToken(res.accessToken);
    return ok({ user: { id: String(res.userId), username: res.nickname } });
  },

  /**
   * 로그아웃
   *
   * [실제 API] JWT는 서버 상태 없음 → 클라이언트에서 토큰 삭제만
   */
  logout: async () => {
    if (USE_MOCK) {
      await delay(150);
      clearStoredUser();
      clearStoredToken();
      return ok({});
    }
    clearToken();
    return ok();
  },

  /**
   * 내 프로필 상세 조회
   *
   * [실제 API]
   *   GET /api/auth/me  (me 와 동일, 추가 필드 포함)
   *
   * TODO: 백엔드에 상세 프로필 엔드포인트 추가 시 업데이트
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
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) return res;
    return ok({
      user: {
        id: String(res.id),
        username: res.nickname,
        email: res.email,
        pubgNickname: res.pubgNickname,
        totalSessions: res.totalSessions,
        wins: res.wins,
        losses: res.losses,
        winRate: res.winRate,
      },
    });
  },

  /**
   * 비밀번호 변경
   *
   * TODO: 백엔드 비밀번호 변경 엔드포인트 미구현 → mock 유지
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
    // TODO: PUT /api/auth/password 구현 시 연결
    return err('비밀번호 변경은 아직 지원되지 않습니다');
  },

  /**
   * 닉네임 중복 확인
   *
   * TODO: 백엔드 중복 확인 엔드포인트 미구현 → mock 유지
   */
  checkUsername: async (nickname) => {
    if (USE_MOCK) {
      await delay(300);
      if (!/^[a-zA-Z0-9_]{2,20}$/.test(nickname))
        return err('영문·숫자·언더스코어만 사용 가능 (2~20자)');
      if (findUser(nickname))
        return err('이미 사용 중인 닉네임입니다');
      return ok({ available: true, message: '사용 가능한 닉네임입니다' });
    }
    // TODO: GET /api/auth/check-nickname 구현 시 연결
    const res = await apiFetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
    return res;
  },
};


// ─────────────────────────────────────────
//  🏠 Session API (킬내기 방) — 하위 호환용
//  실제 세션 로직은 lib/room-api.js 에 있음
// ─────────────────────────────────────────

export const SessionAPI = {

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

  create: async ({ title, rule, teams }) => {
    if (USE_MOCK) {
      await delay(400);
      const user = getStoredUser();
      const session = {
        id: genId('session'), title,
        code: genCode(), status: 'WAITING',
        hostId: user?.id || 'user-001',
        rule, teams, createdAt: new Date().toISOString(),
      };
      _runtimeSessions.push(session);
      return ok(session);
    }
    return apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, rule, teams }),
    });
  },

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
