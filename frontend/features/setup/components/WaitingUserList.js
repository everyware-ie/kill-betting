export default function WaitingUserList({ participants, teams, userId, hostUserId }) {
  const allTeamUserIds = new Set(
    (teams || []).flatMap((t) => (t.members || []).map((m) => m.userId))
  );
  const waitingUsers = (participants || []).filter(
    (p) => !allTeamUserIds.has(p.userId)
  );

  if (waitingUsers.length === 0) return null;

  return (
    <div style={{ background: 'rgba(100,100,100,0.05)', borderBottom: '1px solid rgba(200,155,0,0.08)', padding: '8px 24px', flexShrink: 0 }}>
      <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 6 }}>⏳ 대기석 ({waitingUsers.length}명)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {waitingUsers.map((p) => {
          const isMe = p.userId === userId;
          const isHostUser = p.userId === hostUserId;
          return (
            <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, background: isMe ? 'rgba(245,166,35,0.12)' : 'rgba(200,155,0,0.07)', border: `1px solid ${isMe ? 'rgba(245,166,35,0.3)' : 'rgba(200,155,0,0.15)'}`, fontSize: 11 }}>
              <span>{isHostUser ? '👑' : '👤'}</span>
              <span style={{ color: isMe ? '#F5A623' : '#E8DFC0', fontWeight: isMe ? 700 : 400 }}>
                {p.username}{isMe ? ' (나)' : ''}
              </span>
              {isHostUser && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, background: '#FFD700', color: '#1a1500', fontWeight: 700 }}>방장</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}