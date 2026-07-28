'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import useFavoriteNicknames, { MAX_FAVORITES } from '../hooks/useFavoriteNicknames';

/**
 * 마이페이지의 닉네임 즐겨찾기 관리 섹션.
 * 자주 함께하는 팀원 닉네임을 저장해두고 팀 구성 시 재사용한다.
 */
export default function FavoriteNicknameSection() {
  const { favorites, loading, error, setError, isFull, addFavorite, removeFavorite } =
    useFavoriteNicknames();
  const [input, setInput] = useState('');

  const handleAdd = async () => {
    const added = await addFavorite(input);
    if (added) setInput('');
  };

  return (
    <div style={{
      background: 'var(--kn-surface-1)',
      border: '1px solid var(--kn-border)',
      borderRadius: 'var(--kn-r-lg)',
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', lineHeight: 1.6 }}>
        자주 함께하는 팀원 닉네임을 저장해두면 팀 구성 시 타이핑 없이 추가할 수 있습니다.
      </div>

      {/* 추가 입력 */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value.replace(/\s/g, '')); setError(''); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleAdd(); }
          }}
          placeholder="배그 닉네임"
          disabled={isFull}
          style={{
            flex: 1, height: 36, padding: '0 12px',
            background: 'var(--kn-surface-3)',
            border: '1px solid var(--kn-border-strong)',
            color: 'var(--kn-text)',
            borderRadius: 'var(--kn-r-md)',
            fontSize: 13, outline: 'none', fontFamily: 'inherit',
            opacity: isFull ? 0.5 : 1,
          }}
        />
        <Button variant="primary" onClick={handleAdd} disabled={!input || isFull}>
          추가
        </Button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--kn-danger)',
        }}>
          <Icon name="alert" size={13} /> {error}
        </div>
      )}

      {isFull && !error && (
        <div style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>
          즐겨찾기가 가득 찼습니다 (최대 {MAX_FAVORITES}개). 삭제 후 추가해주세요.
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--kn-text-dim)' }}>불러오는 중...</div>
      ) : favorites.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--kn-text-dim)' }}>
          아직 저장한 닉네임이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {favorites.map((favorite) => (
            <span
              key={favorite.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'var(--kn-surface-3)',
                border: '1px solid var(--kn-border)',
                borderRadius: 'var(--kn-r-md)',
                padding: '4px 10px',
                fontSize: 12,
                color: 'var(--kn-text)',
              }}
            >
              <Icon name="user" size={11} color="var(--kn-text-muted)" />
              {favorite.nickname}
              <button
                onClick={() => removeFavorite(favorite.id)}
                title="즐겨찾기에서 삭제"
                style={{
                  background: 'none', border: 'none', color: 'var(--kn-text-dim)',
                  cursor: 'pointer', padding: 0, display: 'flex', marginLeft: 2,
                }}
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
