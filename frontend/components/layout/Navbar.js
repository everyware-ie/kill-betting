'use client';

import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: 'rgba(22, 19, 8, 0.8)',
      borderBottom: '1px solid rgba(200, 155, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {user && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#F5A623',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          <span>{user.nickname || user.username}</span>
        </div>
      )}
    </nav>
  );
}