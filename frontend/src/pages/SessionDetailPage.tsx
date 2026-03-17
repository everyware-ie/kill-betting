import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionApi, teamApi } from '../api';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const id = Number(sessionId);

  const [newTeamName, setNewTeamName] = useState('');
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamApi.getTeams(id).then((r) => r.data.data),
  });

  const createTeam = useMutation({
    mutationFn: () => teamApi.create(id, newTeamName),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams', id] }); setNewTeamName(''); },
  });

  const addMember = useMutation({
    mutationFn: () => teamApi.addMember(id, selectedTeamId!, Number(addMemberUserId)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams', id] }); setAddMemberUserId(''); setSelectedTeamId(null); },
  });

  const startSession = useMutation({
    mutationFn: () => sessionApi.start(id),
    onSuccess: () => navigate(`/sessions/${id}/scoreboard`),
  });

  if (isLoading) return <div style={styles.loading}>로딩 중...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/')}>← 뒤로</button>
        <h2 style={styles.title}>세션 관리</h2>
        <button style={styles.scoreBtn} onClick={() => navigate(`/sessions/${id}/scoreboard`)}>
          스코어보드 →
        </button>
      </div>

      {/* 팀 목록 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>팀 구성</h3>
        {teams.map((team) => (
          <div key={team.id} style={styles.teamCard}>
            <div style={styles.teamHeader}>
              <span style={styles.teamName}>{team.name}</span>
              <span style={styles.teamKills}>{team.effectiveKills}킬</span>
            </div>
            <div style={styles.members}>
              {team.memberNicknames.length === 0
                ? <span style={styles.noMember}>멤버 없음</span>
                : team.memberNicknames.map((nick, i) => (
                    <span key={i} style={styles.memberTag}>{nick}</span>
                  ))}
            </div>
          </div>
        ))}

        {/* 팀 생성 */}
        <div style={styles.addRow}>
          <input style={styles.input} placeholder="팀 이름 입력" value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)} />
          <button style={styles.addBtn} onClick={() => newTeamName && createTeam.mutate()}>
            팀 추가
          </button>
        </div>
      </div>

      {/* 멤버 추가 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>멤버 추가</h3>
        <select style={styles.input} value={selectedTeamId ?? ''}
          onChange={(e) => setSelectedTeamId(Number(e.target.value))}>
          <option value="">팀 선택</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div style={styles.addRow}>
          <input style={styles.input} placeholder="사용자 ID 입력" type="number"
            value={addMemberUserId} onChange={(e) => setAddMemberUserId(e.target.value)} />
          <button style={styles.addBtn}
            onClick={() => selectedTeamId && addMemberUserId && addMember.mutate()}>
            추가
          </button>
        </div>
      </div>

      <button style={styles.startBtn} onClick={() => startSession.mutate()}
        disabled={startSession.isPending}>
        {startSession.isPending ? '시작 중...' : '🚀 킬내기 시작'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0f1923', color: '#fff', padding: '20px 16px' },
  loading: { color: '#fff', textAlign: 'center', paddingTop: '100px', background: '#0f1923', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  back: { background: 'transparent', color: '#8899aa', border: 'none', fontSize: '16px', cursor: 'pointer' },
  title: { margin: 0, fontSize: '20px', flex: 1 },
  scoreBtn: { background: 'transparent', color: '#f5a623', border: '1px solid #f5a623', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' },
  section: { background: '#1a2634', borderRadius: '12px', padding: '16px', marginBottom: '16px' },
  sectionTitle: { margin: '0 0 12px', fontSize: '15px', color: '#f5a623' },
  teamCard: { background: '#0f1923', borderRadius: '8px', padding: '12px', marginBottom: '8px' },
  teamHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  teamName: { fontWeight: 'bold' },
  teamKills: { color: '#f5a623', fontWeight: 'bold' },
  members: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  memberTag: { background: '#1a2634', color: '#ccc', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' },
  noMember: { color: '#666', fontSize: '12px' },
  addRow: { display: 'flex', gap: '8px', marginTop: '8px' },
  input: { flex: 1, padding: '10px', background: '#0f1923', border: '1px solid #2a3a4a', borderRadius: '8px', color: '#fff', fontSize: '14px' },
  addBtn: { padding: '10px 16px', background: '#2a3a4a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' },
  startBtn: { width: '100%', padding: '16px', background: '#f5a623', color: '#000', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' },
};
