import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sessionApi, authApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { SessionStatus } from '../types';

const statusLabel: Record<SessionStatus, string> = {
  WAITING: '대기 중',
  IN_PROGRESS: '진행 중',
  ENDED: '종료',
};
const statusColor: Record<SessionStatus, string> = {
  WAITING: '#8899aa',
  IN_PROGRESS: '#4caf50',
  ENDED: '#666',
};

export default function HomePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then((r) => r.data.data),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionApi.getMy().then((r) => r.data.data),
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🎮 킬내기</h1>
        <div style={styles.headerRight}>
          {meData && <span style={styles.nickname}>{meData.nickname}</span>}
          <button style={styles.logoutBtn} onClick={logout}>로그아웃</button>
        </div>
      </header>

      {meData && (
        <div style={styles.statsCard}>
          <div style={styles.stat}><span style={styles.statVal}>{meData.totalSessions}</span><span style={styles.statLabel}>총 게임</span></div>
          <div style={styles.stat}><span style={styles.statVal}>{meData.wins}</span><span style={styles.statLabel}>승</span></div>
          <div style={styles.stat}><span style={styles.statVal}>{meData.losses}</span><span style={styles.statLabel}>패</span></div>
          <div style={styles.stat}><span style={styles.statVal}>{meData.winRate.toFixed(1)}%</span><span style={styles.statLabel}>승률</span></div>
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>내 킬내기 세션</h2>
          <button style={styles.createBtn} onClick={() => navigate('/sessions/new')}>+ 새 세션</button>
        </div>

        {sessions.length === 0 ? (
          <div style={styles.empty}>
            <p>아직 참여한 킬내기 세션이 없습니다.</p>
            <p style={{ color: '#8899aa', fontSize: '13px' }}>새 세션을 만들어 킬내기를 시작해보세요!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} style={styles.sessionCard}
              onClick={() => navigate(`/sessions/${session.id}`)}>
              <div style={styles.sessionLeft}>
                <span style={styles.sessionName}>{session.name}</span>
                <span style={styles.sessionMeta}>
                  호스트: {session.hostNickname}
                  {session.targetKills && ` · 목표 ${session.targetKills}킬`}
                </span>
              </div>
              <span style={{ ...styles.statusBadge, background: statusColor[session.status] }}>
                {statusLabel[session.status]}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0f1923', color: '#fff', padding: '0 16px 40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #1a2634' },
  logo: { color: '#f5a623', margin: 0, fontSize: '22px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  nickname: { color: '#ccc', fontSize: '14px' },
  logoutBtn: { background: 'transparent', color: '#8899aa', border: '1px solid #2a3a4a', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' },
  statsCard: { display: 'flex', gap: '16px', background: '#1a2634', borderRadius: '12px', padding: '20px', margin: '24px 0' },
  stat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  statVal: { fontSize: '24px', fontWeight: 'bold', color: '#f5a623' },
  statLabel: { fontSize: '12px', color: '#8899aa' },
  section: { marginTop: '8px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { margin: 0, fontSize: '18px', color: '#fff' },
  createBtn: { background: '#f5a623', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' },
  sessionCard: { background: '#1a2634', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  sessionLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sessionName: { fontWeight: 'bold', fontSize: '15px' },
  sessionMeta: { fontSize: '12px', color: '#8899aa' },
  statusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#fff' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#ccc', background: '#1a2634', borderRadius: '12px' },
};
