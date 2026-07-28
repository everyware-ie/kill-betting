'use client';

import Icon from '@/components/ui/Icon';

const TEAM_COLORS = [
  'oklch(0.65 0.22 25)',   // red
  'oklch(0.75 0.16 75)',   // amber
  'oklch(0.72 0.19 145)',  // green
  'oklch(0.65 0.18 265)',  // indigo
  'oklch(0.70 0.18 330)',  // pink
  'oklch(0.68 0.15 200)',  // teal
];

export default function TeamCard({
  team, teamIndex = 0, isHost, userId, hostUserId,
  inputs, setInputs,
  onAddPlayer, onRemovePlayer, onUnassignLeader, onDeleteTeam,
}) {
  const players = team.players || [];
  const dotColor = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
  const maxPlayers = team.maxPlayers;

  // 팀원(닉네임) 관리는 Host 또는 이 팀의 리더가 할 수 있다.
  // 팀 삭제·리더 해제처럼 팀 구조를 바꾸는 조작은 Host 전용으로 유지한다.
  const canManagePlayers = isHost || (userId != null && userId === team.leaderUserId);

  return (
    <div style={{
      background: 'var(--kn-surface-1)',
      border: '1px solid var(--kn-border)',
      borderRadius: 'var(--kn-r-lg)',
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 12,
      minHeight: 120,
    }}>

      {/* 팀 헤더: 컬러 도트 + TEAM + 이름 + 인원수 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: 'var(--kn-text-muted)' }}>TEAM</span>
          <span style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: 'var(--kn-text)' }}>{team.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {team.leaderNickname && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 'var(--kn-r-sm)',
              background: 'var(--kn-accent)',
              color: 'var(--kn-bg)',
            }}>
              <Icon name="shield" size={10} /> {team.leaderNickname}
              {isHost && (
                <button
                  onClick={() => onUnassignLeader(team.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--kn-bg)', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: 2, opacity: 0.7 }}
                >
                  <Icon name="close" size={10} />
                </button>
              )}
            </span>
          )}
          <span data-mono="" style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>
            {players.length}{maxPlayers ? `/${maxPlayers}` : ''}
          </span>
          {isHost && (
            <button
              onClick={() => onDeleteTeam(team.id)}
              title="팀 삭제"
              style={{ background: 'none', border: 'none', color: 'var(--kn-text-dim)', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 플레이어 칩 목록 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {players.map((player) => (
          <span
            key={player.id}
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
            {player.nickname}
            {canManagePlayers && (
              <button
                onClick={() => onRemovePlayer(team.id, player.id)}
                style={{ background: 'none', border: 'none', color: 'var(--kn-text-dim)', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: 2 }}
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </span>
        ))}

        {players.length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--kn-text-dim)', padding: '4px 0' }}>닉네임을 입력해주세요</span>
        )}
      </div>

      {/* 닉네임 입력 (호스트 또는 이 팀의 리더) */}
      {canManagePlayers && (
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          <input
            value={inputs[team.id] || ''}
            onChange={(e) => setInputs((p) => ({ ...p, [team.id]: e.target.value.replace(/\s/g, '') }))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); onAddPlayer(team.id); } }}
            placeholder="배그 닉네임..."
            style={{
              flex: 1,
              background: 'var(--kn-surface-3)',
              border: '1px solid var(--kn-border)',
              color: 'var(--kn-text)',
              padding: '6px 10px',
              borderRadius: 'var(--kn-r-md)',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => onAddPlayer(team.id)}
            style={{
              background: 'none',
              border: '1px solid var(--kn-border)',
              color: 'var(--kn-text-muted)',
              padding: '6px 10px',
              borderRadius: 'var(--kn-r-md)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            추가
          </button>
        </div>
      )}
    </div>
  );
}