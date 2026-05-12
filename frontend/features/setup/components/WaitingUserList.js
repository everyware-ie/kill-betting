'use client';

import { useState } from 'react';

export default function WaitingUserList({ waitingUsers, teams, userId, hostUserId, isHost, onMoveToTeam }) {
  const [selectedUser, setSelectedUser] = useState(null);

  if (!waitingUsers || waitingUsers.length === 0) return null;

  const handleMove = (teamId) => {
    if (!selectedUser) return;
    onMoveToTeam(teamId, selectedUser.userId);
    setSelectedUser(null);
  };

  return (
    <div style={{ background: 'rgba(100,100,100,0.05)', borderBottom: '1px solid rgba(200,155,0,0.08)', padding: '8px 24px', flexShrink: 0 }}>
      <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 6 }}>⏳ 대기석 ({waitingUsers.length}명)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {waitingUsers.map((p) => {
          const isMe = p.userId === userId;
          const isHostUser = p.userId === hostUserId;
          const isSelected = selectedUser?.userId === p.userId;
          return (
            <div
              key={p.userId}
              onClick={() => isHost && setSelectedUser(isSelected ? null : p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 12, fontSize: 11,
                background: isSelected ? 'rgba(245,166,35,0.2)' : isMe ? 'rgba(245,166,35,0.12)' : 'rgba(200,155,0,0.07)',
                border: `1px solid ${isSelected ? '#F5A623' : isMe ? 'rgba(245,166,35,0.3)' : 'rgba(200,155,0,0.15)'}`,
                cursor: isHost ? 'pointer' : 'default',
              }}
            >
              <span>{isHostUser ? '👑' : '👤'}</span>
              <span style={{ color: isMe ? '#F5A623' : '#E8DFC0', fontWeight: isMe ? 700 : 400 }}>
                {p.nickname}{isMe ? ' (나)' : ''}
              </span>
              {isHostUser && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, background: '#FFD700', color: '#1a1500', fontWeight: 700 }}>방장</span>}
            </div>
          );
        })}
      </div>

      {/* 선택된 유저가 있으면 팀 선택 UI 표시 */}
      {isHost && selectedUser && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#F5A623', fontWeight: 700 }}>{selectedUser.nickname}</span>
          <span style={{ fontSize: 11, color: '#8A8060' }}>→</span>
          {(teams || []).filter((t) => !t.leaderUserId).map((team) => (
            <button
              key={team.id}
              onClick={() => handleMove(team.id)}
              style={{
                background: 'rgba(200,155,0,0.08)', border: '1px solid rgba(200,155,0,0.25)',
                color: '#E8DFC0', fontSize: 11, padding: '3px 10px', borderRadius: 4,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
