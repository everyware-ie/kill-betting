/**
 * ============================================================
 *  lib/favorite-api.js — 닉네임 즐겨찾기 API 레이어
 * ============================================================
 *
 *  자주 쓰는 배그 닉네임을 사용자 단위로 저장한다(세션 비종속).
 *  USE_MOCK = true 이면 목 데이터를 반환한다 (lib/api.js 와 동일 방식).
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

const BASE_PATH = '/users/me/favorite-nicknames';

let _mockFavorites = [
  { id: 1, nickname: 'jminkkk' },
  { id: 2, nickname: 'JiEung2' },
];

const _mockRecentUnfavorited = ['pubg_friend1', 'pubg_friend2'];

const request = async (path, options = {}, fallbackMessage) => {
  try {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
      return err('접근 권한이 없습니다.', { forbidden: true });
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      return err(body.message || fallbackMessage);
    }
    return ok(body.data);
  } catch {
    return err(fallbackMessage);
  }
};

export const FavoriteAPI = {
  /**
   * 즐겨찾기 목록 + 최근 함께한 닉네임 조회
   *   GET /api/users/me/favorite-nicknames
   *   Response 200: { favorites: [{ id, nickname }], recentUnfavorited: [nickname] }
   *
   *   recentUnfavorited는 저장되는 값이 아니라 조회 시 계산되는 파생 데이터로,
   *   내가 리더였던 최근 세션에서 등록한 닉네임 중 즐겨찾기에 없는 것만 최대 10개다.
   */
  list: async () => {
    if (USE_MOCK) {
      await delay();
      return ok({
        favorites: [..._mockFavorites],
        recentUnfavorited: [..._mockRecentUnfavorited],
      });
    }
    return request(BASE_PATH, { method: 'GET' }, '즐겨찾기를 불러오지 못했습니다.');
  },

  /**
   * 즐겨찾기 추가
   *   POST /api/users/me/favorite-nicknames  { nickname }
   *   Response 400: 20개 상한 초과 또는 중복 닉네임
   */
  add: async (nickname) => {
    if (USE_MOCK) {
      await delay();
      if (_mockFavorites.length >= 20) return err('즐겨찾기는 최대 20개까지 등록할 수 있습니다.');
      if (_mockFavorites.some((f) => f.nickname === nickname)) {
        return err('이미 즐겨찾기에 등록된 닉네임입니다.');
      }
      const created = { id: Date.now(), nickname };
      _mockFavorites = [created, ..._mockFavorites];
      return ok(created);
    }
    return request(
      BASE_PATH,
      { method: 'POST', body: JSON.stringify({ nickname }) },
      '즐겨찾기 추가에 실패했습니다.',
    );
  },

  /**
   * 즐겨찾기 삭제
   *   DELETE /api/users/me/favorite-nicknames/{favoriteId}
   */
  remove: async (favoriteId) => {
    if (USE_MOCK) {
      await delay();
      _mockFavorites = _mockFavorites.filter((f) => f.id !== favoriteId);
      return ok(null);
    }
    return request(
      `${BASE_PATH}/${favoriteId}`,
      { method: 'DELETE' },
      '즐겨찾기 삭제에 실패했습니다.',
    );
  },
};
