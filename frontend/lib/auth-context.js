/**
 * ============================================================
 *  lib/auth-context.js — 전역 인증 상태 관리
 * ============================================================
 *
 *  앱 전체에서 로그인 유저 정보를 공유합니다.
 *
 *  사용법:
 *    const { user, login, logout, loading } = useAuth();
 *
 *  user 구조:
 *    { id: string, username: string }
 *    로그아웃 상태 = null
 *
 * ============================================================
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 기존 세션 확인
  useEffect(() => {
    AuthAPI.me().then((res) => {
      if (res.ok) setUser(res.user);
      setLoading(false);
    });
  }, []);

  /**
   * 로그인
   * @param {string} email     이메일 (실제 API) 또는 아이디 (mock)
   * @param {string} password  비밀번호
   * @returns {{ ok: boolean, error?: string }}
   */
  const login = async (email, password) => {
    const res = await AuthAPI.login(email, password);
    if (res.ok) setUser(res.user);
    return res;
  };

  /**
   * 회원가입
   * @param {string} nickname  닉네임 (표시명)
   * @param {string} email     이메일
   * @param {string} password  비밀번호
   * @returns {{ ok: boolean, error?: string }}
   */
  const signup = async (nickname, email, password) => {
    const res = await AuthAPI.signup(nickname, email, password);
    if (res.ok) setUser(res.user);
    return res;
  };

  /** 로그아웃 */
  const logout = async () => {
    await AuthAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다');
  return ctx;
}
