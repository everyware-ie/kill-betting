'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

const INQUIRY_URL = 'https://open.kakao.com/o/ghUybUxi';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      background: 'var(--kn-surface-1)',
      borderBottom: '1px solid var(--kn-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* 로고 — 클릭 시 대시보드로 이동 */}
      <div
        onClick={() => router.push('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{
          width: 28, height: 28,
          background: 'var(--kn-accent)',
          display: 'grid', placeItems: 'center',
          borderRadius: 'var(--kn-r-sm)',
        }}>
          <Icon name="target" size={17} color="var(--kn-bg)" strokeWidth={2} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.02em' }}>
          Killnagi
        </span>
      </div>

      {/* 우측 액션 영역 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* 다크모드 토글 */}
        <Button
          variant="ghost"
          size="sm"
          icon={theme === 'dark' ? 'sun' : 'moon'}
          onClick={toggle}
        />

        {/* 문의하기 */}
        <button
          title="문의하기"
          onClick={() => window.open(INQUIRY_URL, '_blank', 'noopener,noreferrer')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            borderRadius: 'var(--kn-r-sm)',
            border: '1px solid var(--kn-border)',
            background: 'transparent',
            color: 'var(--kn-text-muted)',
            fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--kn-surface-2)';
            e.currentTarget.style.color = 'var(--kn-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--kn-text-muted)';
          }}
        >
          <Icon name="message" size={14} />
          문의
        </button>

        {user && (
          <>
            {/* 닉네임 — 클릭 시 마이페이지로 이동 */}
            <div
              onClick={() => router.push('/mypage')}
              title="마이페이지"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--kn-text-muted)',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 'var(--kn-r-sm)',
                transition: 'background .15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--kn-surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name="user" size={16} />
              <span style={{ fontWeight: 'var(--kn-w-semi)', color: 'var(--kn-text)' }}>
                {user.nickname || user.username}
              </span>
            </div>

            {logout && (
              <Button variant="ghost" size="sm" icon="logout" onClick={logout} />
            )}
          </>
        )}
      </div>
    </nav>
  );
}