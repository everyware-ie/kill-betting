'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

export default function Navbar() {
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
      {/* logomark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

      {/* user actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button
          variant="ghost"
          size="sm"
          icon={theme === 'dark' ? 'sun' : 'moon'}
          onClick={toggle}
        />
        {user && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: 'var(--kn-text-muted)',
            }}>
              <Icon name="user" size={16} />
              <span style={{ fontWeight: 'var(--kn-w-semi)', color: 'var(--kn-text)' }}>
                {user.nickname || user.username}
              </span>
            </div>
            <Button variant="ghost" size="sm" icon="settings" onClick={() => window.location.href = '/mypage'} />
            {logout && (
              <Button variant="ghost" size="sm" icon="logout" onClick={logout} />
            )}
          </>
        )}
      </div>
    </nav>
  );
}