'use client';

import { useCallback, useEffect, useState } from 'react';
import { FavoriteAPI } from '@/lib/favorite-api';

export const MAX_FAVORITES = 20;

/**
 * 닉네임 즐겨찾기 목록 상태.
 * 사용자 단위로 저장되므로 세션과 무관하게 어느 화면에서든 재사용할 수 있다.
 */
export default function useFavoriteNicknames({ enabled = true } = {}) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await FavoriteAPI.list();
    setLoading(false);
    if (!res.success) { setError(res.error); return; }
    setError('');
    setFavorites(res.data || []);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  const addFavorite = async (nickname) => {
    const trimmed = (nickname || '').trim();
    if (!trimmed) return false;
    if (/\s/.test(trimmed)) {
      setError('배그 닉네임에는 공백을 사용할 수 없습니다');
      return false;
    }

    setError('');
    const res = await FavoriteAPI.add(trimmed);
    if (!res.success) { setError(res.error); return false; }

    setFavorites((prev) => [res.data, ...prev]);
    return true;
  };

  const removeFavorite = async (favoriteId) => {
    setError('');
    const res = await FavoriteAPI.remove(favoriteId);
    if (!res.success) { setError(res.error); return false; }

    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    return true;
  };

  return {
    favorites,
    loading,
    error,
    setError,
    isFull: favorites.length >= MAX_FAVORITES,
    reload: load,
    addFavorite,
    removeFavorite,
  };
}
