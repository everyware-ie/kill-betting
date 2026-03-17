import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sessionApi } from '../api';

export default function ScoreboardPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const id = Number(sessionId);

  const { data: scoreboard, isLoading } = useQuery({
    queryKey: ['scoreboard', id],
    queryFn: () => sessionApi.getScoreboard(id).then((r) => r.data.data),
    refetchInterval: 15000, // 15초마다 자동 갱신
  });

  if (isLoading || !scoreboard) return <div style={styles.loading}>로딩 중...</div>;

  const sorted = [...scoreboard.teams].sort((a, b) => b.effectiveKills - a.effectiveKills);
  const topKills = sorted[0]?.effectiveKills || 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate(`/sessions/${id}`)}>← 뒤로</button>
        <h2 style={styles.title}>🏆 스코어보드</h2>
        <span style={styles.sessionName}>{scoreboard.sessionName}</span>
      </div>

      <div style={styles.teams}>
        {sorted.map((team, idx) => (
          <div key={team.teamId} style={{ ...styles.teamCard, ...(idx === 0 ? styles.topTeam : {}) }}>
            <div style={styles.rank}>#{idx + 1}</div>
            <div style={styles.teamInfo}>
              <div style={styles.teamName}>{team.teamName}</div>

              {/* 킬 진행 바 */}
              <div style={styles.barBg}>
                <div style={{ ...styles.barFill, width: `${(team.effectiveKills / topKills) * 100}%` }} />
              </div>

              <div style={styles.killRow}>
                <span style={styles.killVal}>{team.effectiveKills}킬</span>
                <span style={styles.killDetail}>
                  기본 {team.totalKills}
                  {team.bonusKills > 0 && <span style={{ color: '#4caf50' }}> +{team.bonusKills}</span>}
                  {team.penaltyKills > 0 && <span style={{ color: '#f44336' }}> -{team.penaltyKills}</span>}
                </span>
              </div>

              <div style={styles.members}>
                {team.members.map((m) => (
                  <div key={m.userId} style={styles.member}>
                    <span style={styles.memberNick}>{m.nickname}</span>
                    <span style={styles.memberKills}>{m.totalKills}킬</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p style={styles.refresh}>15초마다 자동 갱신됩니다</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0f1923', color: '#fff', padding: '20px 16px' },
  loading: { color: '#fff', textAlign: 'center', paddingTop: '100px', background: '#0f1923', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' },
  back: { background: 'transparent', color: '#8899aa', border: 'none', fontSize: '16px', cursor: 'pointer' },
  title: { margin: 0, fontSize: '20px' },
  sessionName: { color: '#8899aa', fontSize: '14px', marginLeft: 'auto' },
  teams: { display: 'flex', flexDirection: 'column', gap: '12px' },
  teamCard: { background: '#1a2634', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', border: '2px solid transparent' },
  topTeam: { border: '2px solid #f5a623' },
  rank: { fontSize: '24px', fontWeight: 'bold', color: '#f5a623', minWidth: '36px' },
  teamInfo: { flex: 1 },
  teamName: { fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' },
  barBg: { height: '6px', background: '#0f1923', borderRadius: '3px', marginBottom: '8px' },
  barFill: { height: '100%', background: '#f5a623', borderRadius: '3px', transition: 'width 0.5s' },
  killRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  killVal: { fontSize: '22px', fontWeight: 'bold', color: '#f5a623' },
  killDetail: { fontSize: '12px', color: '#8899aa' },
  members: { display: 'flex', flexDirection: 'column', gap: '4px' },
  member: { display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#0f1923', borderRadius: '6px' },
  memberNick: { fontSize: '13px', color: '#ccc' },
  memberKills: { fontSize: '13px', color: '#f5a623', fontWeight: 'bold' },
  refresh: { textAlign: 'center', color: '#666', fontSize: '12px', marginTop: '20px' },
};
