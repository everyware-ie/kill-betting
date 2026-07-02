'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';

export default function RoomCard({ room, onClick }) {
  const [hovered, setHovered] = useState(false);

  const createdAt = new Date(room.createdAt).toLocaleString('ko', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const isLive = room.status === 'LIVE' || room.status === 'IN_PROGRESS';
  const isDone = room.status === 'DONE' || room.status === 'ENDED';
  const statusIcon = isLive ? 'target' : isDone ? 'trophy' : 'clock';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? 'var(--kn-surface-2)' : 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '16px 20px', cursor: 'pointer', transition: 'background .15s, border-color .15s', display: 'flex', alignItems: 'center', gap: 16 }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 'var(--kn-r-md)', background: 'var(--kn-accent-bg)', border: '1px solid color-mix(in oklab, var(--kn-accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={statusIcon} size={20} color="var(--kn-accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.name || room.title}
          </div>
          <StatusBadge status={room.status} />
          {room.myRole && <RoleBadge role={room.myRole} />}
        </div>
        <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>방장: {room.hostNickname}</span>
          {room.targetKills && <span>목표 {room.targetKills}킬</span>}
          <span>{createdAt}</span>
        </div>
      </div>
      <Icon name="chevron" size={16} color="var(--kn-text-dim)" />
    </div>
  );
}
