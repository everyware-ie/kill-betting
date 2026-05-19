'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';

export default function WaitingUserList({ waitingUsers, teams, userId, hostUserId, isHost, onMoveToTeam }) {
  const [selectedUser, setSelectedUser] = useState(null);

  if (!waitingUsers || waitingUsers.length === 0) return null;

  const handleMove = (teamId) => {
    if (!selectedUser) return;
    onMoveToTeam(teamId, selectedUser.userId);
    setSelectedUser(null);
  };

  return (
    <div>
      <div data-label="" style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginBottom: 12, letterSpacing: 1.2, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="clock" size={12} /> 팀 리더 배정 ({waitingUsers.length})
      </div>
      <div style={{
        background: 'var(--kn-surface-1)',
        border: '1px solid var(--kn-border)',
        borderRadius: 'var(--kn-r-lg)',
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {waitingUsers.map((p) => {
          const isMe = p.userId === userId;
          const isHostUser = p.userId === hostUserId;
          const isSelected = selectedUser?.userId === p.userId;
          return (
            <div
              key={p.userId}
              onClick={() => isHost && setSelectedUser(isSelected ? null : p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 8px',
                borderRadius: 'var(--kn-r-md)',
                fontSize: 12,
                background: isSelected
                  ? 'var(--kn-accent-bg)'
                  : 'transparent',
                border: `1px solid ${isSelected ? 'var(--kn-accent)' : 'transparent'}`,
                cursor: isHost ? 'pointer' : 'default',
              }}
            >
              <Icon name={isHostUser ? 'crown' : 'user'} size={12} color={isHostUser ? 'var(--kn-accent)' : 'var(--kn-text-dim)'} />
              <span style={{ flex: 1, color: isMe ? 'var(--kn-accent)' : 'var(--kn-text)', fontWeight: isMe ? 700 : 400 }}>
                {p.nickname}{isMe ? ' (나)' : ''}
              </span>
              {isHostUser && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, background: 'var(--kn-accent)', color: 'var(--kn-bg)', fontWeight: 700 }}>방장</span>}
            </div>
          );
        })}

        {/* 팀 배정 선택 */}
        {isHost && selectedUser && (
          <div style={{ borderTop: '1px solid var(--kn-border)', paddingTop: 8, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--kn-accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              {selectedUser.nickname} <Icon name="arrow" size={11} color="var(--kn-text-dim)" />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(teams || []).filter((t) => !t.leaderUserId).map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleMove(team.id)}
                  style={{
                    background: 'var(--kn-surface-3)',
                    border: '1px solid var(--kn-border)',
                    color: 'var(--kn-text)',
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 'var(--kn-r-sm)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
