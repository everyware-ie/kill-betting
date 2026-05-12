'use client';

export default function TeamCard({
  team, isMyTeam, isHost, userId, hostUserId, maxPerTeam,
  inputs, setInputs,
  onMoveTeam, onLeaveTeam, onAddPlayer, onRemovePlayer,
}) {
  const isFull = team.players.length >= maxPerTeam;
  const teamMembers = team.members || [];
  const teamHasMember = teamMembers.length > 0;

  return (
    <div style={{ background: '#1C1A0C', border: `1px solid ${isMyTeam ? 'rgba(245,166,35,0.45)' : 'rgba(200,155,0,0.18)'}`, borderRadius: 8, overflow: 'hidden' }}>

      {/* 팀 헤더 */}
      <div style={{ background: isMyTeam ? 'rgba(245,166,35,0.1)' : 'rgba(200,155,0,0.06)', borderBottom: '1px solid rgba(200,155,0,0.12)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: isMyTeam ? '#F5A623' : '#8A8060' }}>{team.name}</span>
            {isMyTeam && <span style={{ fontSize: 10, background: '#F5A623', color: '#1a1500', padding: '1px 6px', borderRadius: 2, fontWeight: 700 }}>MY TEAM</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: teamHasMember ? '#F5A623' : '#555', background: 'rgba(200,155,0,0.07)', border: '1px solid rgba(200,155,0,0.12)', borderRadius: 3, padding: '1px 6px' }}>
              👤 {teamMembers.length}/1
            </span>
            <span style={{ fontSize: 10, color: isFull ? '#E53935' : team.players.length > 0 ? '#F5A623' : '#555', background: 'rgba(200,155,0,0.07)', border: `1px solid ${isFull ? 'rgba(229,57,53,0.25)' : 'rgba(200,155,0,0.12)'}`, borderRadius: 3, padding: '1px 6px' }}>
              🎮 {team.players.length}/{maxPerTeam}
            </span>
          </div>
        </div>
        <TeamActionButton
          isMyTeam={isMyTeam}
          teamHasMember={teamHasMember}
          hasMyTeam={!!onLeaveTeam}
          onLeave={onLeaveTeam}
          onMove={() => onMoveTeam(team.id)}
        />
      </div>

      {/* 로그인 유저 목록 */}
      {teamMembers.length > 0 && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(200,155,0,0.08)', background: 'rgba(200,155,0,0.03)' }}>
          <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 6 }}>방 참여자</div>
          {teamMembers.map((member) => {
            const isMe = member.userId === userId;
            return (
              <div key={member.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(200,155,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 22, height: 22, background: isMe ? 'rgba(245,166,35,0.2)' : 'rgba(200,155,0,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                  <span style={{ fontSize: 12, color: isMe ? '#F5A623' : '#E8DFC0', fontWeight: isMe ? 700 : 400 }}>
                    {member.username}{isMe && ' (나)'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {member.userId === hostUserId && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 2, fontWeight: 700, background: '#FFD700', color: '#1a1500' }}>
                      👑 방장
                    </span>
                  )}
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 2, fontWeight: 700, background: '#F5A623', color: '#1a1500' }}>
                    ★ LEADER
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 배그 닉네임 목록 */}
      <div style={{ padding: '10px 14px', minHeight: 48 }}>
        <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 6 }}>배그 닉네임 (킬내기 참가자)</div>
        {team.players.length === 0 ? (
          <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>닉네임을 입력해주세요</div>
        ) : (
          team.players.map((nick) => (
            <div key={nick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(200,155,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5A623', flexShrink: 0 }} />
                <span style={{ fontSize: 13 }}>{nick}</span>
              </div>
              {isHost && <button onClick={() => onRemovePlayer(team.id, nick)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13, padding: '0 4px' }}>✕</button>}
            </div>
          ))
        )}
      </div>

      {/* 닉네임 입력창 */}
      {isHost && (
        !isFull ? (
          <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(200,155,0,0.08)', display: 'flex', gap: 8 }}>
            <input
              value={inputs[team.id] || ''}
              onChange={(e) => setInputs((p) => ({ ...p, [team.id]: e.target.value.replace(/\s/g, '') }))}
              onKeyDown={(e) => e.key === 'Enter' && onAddPlayer(team.id)}
              placeholder="배그 닉네임..."
              style={{ flex: 1, background: '#141200', border: '1px solid rgba(200,155,0,0.22)', color: '#E8DFC0', padding: '7px 10px', borderRadius: 4, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={() => onAddPlayer(team.id)} style={{ background: 'rgba(200,155,0,0.1)', border: '1px solid rgba(200,155,0,0.3)', color: '#F5A623', padding: '7px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>추가</button>
          </div>
        ) : (
          <div style={{ padding: '7px 14px', borderTop: '1px solid rgba(200,155,0,0.08)', fontSize: 11, color: '#555', textAlign: 'center' }}>{maxPerTeam}명 완료</div>
        )
      )}
    </div>
  );
}

function TeamActionButton({ isMyTeam, teamHasMember, hasMyTeam, onLeave, onMove }) {
  if (isMyTeam) {
    return (
      <button onClick={onLeave} style={{ background: 'none', border: '1px solid rgba(229,57,53,0.3)', color: '#E53935', fontSize: 11, padding: '3px 9px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit' }}>
        대기석으로
      </button>
    );
  }
  if (teamHasMember) {
    return <span style={{ fontSize: 10, color: '#555', padding: '3px 9px' }}>자리 없음</span>;
  }
  return (
    <button onClick={onMove} style={{ background: 'none', border: '1px solid rgba(200,155,0,0.3)', color: '#8A8060', fontSize: 11, padding: '3px 9px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit' }}>
      {hasMyTeam ? '이 팀으로 이동' : '이 팀으로 참여'}
    </button>
  );
}