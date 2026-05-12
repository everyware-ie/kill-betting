'use client';

export default function TeamCard({
  team, isHost, userId, hostUserId,
  inputs, setInputs,
  onAddPlayer, onRemovePlayer, onUnassignLeader,
}) {
  const players = team.players || [];

  return (
    <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.18)', borderRadius: 8, overflow: 'hidden' }}>

      {/* 팀 헤더 */}
      <div style={{ background: 'rgba(200,155,0,0.06)', borderBottom: '1px solid rgba(200,155,0,0.12)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#8A8060' }}>{team.name}</span>
          <span style={{ fontSize: 10, color: players.length > 0 ? '#F5A623' : '#555', background: 'rgba(200,155,0,0.07)', border: '1px solid rgba(200,155,0,0.12)', borderRadius: 3, padding: '1px 6px', alignSelf: 'flex-start' }}>
            🎮 {players.length}명
          </span>
        </div>
        {team.leaderNickname && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 2, fontWeight: 700, background: '#F5A623', color: '#1a1500' }}>
              ★ {team.leaderNickname}
            </span>
            {isHost && (
              <button
                onClick={() => onUnassignLeader(team.id)}
                style={{ background: 'none', border: '1px solid rgba(229,57,53,0.3)', color: '#E53935', fontSize: 10, padding: '1px 6px', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                해제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 배그 닉네임 목록 */}
      <div style={{ padding: '10px 14px', minHeight: 48 }}>
        <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 6 }}>배그 닉네임 (킬내기 참가자)</div>
        {players.length === 0 ? (
          <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>닉네임을 입력해주세요</div>
        ) : (
          players.map((player) => (
            <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(200,155,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5A623', flexShrink: 0 }} />
                <span style={{ fontSize: 13 }}>{player.nickname}</span>
              </div>
              {isHost && <button onClick={() => onRemovePlayer(team.id, player.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13, padding: '0 4px' }}>✕</button>}
            </div>
          ))
        )}
      </div>

      {/* 닉네임 입력창 */}
      {isHost && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(200,155,0,0.08)', display: 'flex', gap: 8 }}>
          <input
            value={inputs[team.id] || ''}
            onChange={(e) => setInputs((p) => ({ ...p, [team.id]: e.target.value.replace(/\s/g, '') }))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); onAddPlayer(team.id); } }}
            placeholder="배그 닉네임..."
            style={{ flex: 1, background: '#141200', border: '1px solid rgba(200,155,0,0.22)', color: '#E8DFC0', padding: '7px 10px', borderRadius: 4, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => onAddPlayer(team.id)} style={{ background: 'rgba(200,155,0,0.1)', border: '1px solid rgba(200,155,0,0.3)', color: '#F5A623', padding: '7px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>추가</button>
        </div>
      )}
    </div>
  );
}
