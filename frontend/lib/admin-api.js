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
   *   Response 200: { totalUsers }
   *   Response 403: 어드민 화이트리스트 밖
   */
  getMetrics: async () => {
    if (USE_MOCK) {
      await delay();
      return ok({ totalUsers: 42 });
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
};
