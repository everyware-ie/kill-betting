'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { RoomAPI } from '@/lib/room-api';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Navbar from '@/components/layout/Navbar';

function RoleBadge({ role }) {
  const map = {
    HOST:        { label: '방장',   color: 'var(--kn-accent)' },
    LEADER:      { label: '리더',   color: 'var(--kn-warning)' },
    PARTICIPANT: { label: '참여자', color: 'var(--kn-text-muted)' },
  };
  const r = map[role] || map.PARTICIPANT;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 22, padding: '0 8px',
      borderRadius: 'var(--kn-r-sm)',
      border: `1px solid color-mix(in oklab, ${r.color} 25%, transparent)`,
      background: `color-mix(in oklab, ${r.color} 12%, transparent)`,
      color: r.color,
      fontSize: 11, fontWeight: 500, lineHeight: 1,
    }}>
      {r.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    WAITING:     { label: '대기 중', color: 'var(--kn-warning)', dot: false },
    IN_PROGRESS: { label: '진행 중', color: 'var(--kn-success)', dot: 'live' },
    ENDED:       { label: '종료됨',  color: 'var(--kn-text-dim)', dot: false },
    // 프론트 레거시 호환
    LIVE:        { label: '진행 중', color: 'var(--kn-success)', dot: 'live' },
    DONE:        { label: '종료됨',  color: 'var(--kn-text-dim)', dot: false },
  };
  const s = map[status] || map.ENDED;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 22, padding: '0 8px',
      borderRadius: 'var(--kn-r-sm)',
      border: `1px solid color-mix(in oklab, ${s.color} 25%, transparent)`,
      background: `color-mix(in oklab, ${s.color} 12%, transparent)`,
      color: s.color,
      fontSize: 11, fontWeight: 500, lineHeight: 1,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: s.color,
        animation: s.dot === 'live' ? 'kn-pulse 1.4s infinite' : 'none',
      }} />
      {s.label}
    </span>
  );
}

function RoomCard({ room, onClick }) {
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
      style={{
        background: hovered ? 'var(--kn-surface-2)' : 'var(--kn-surface-1)',
        border: '1px solid var(--kn-border)',
        borderRadius: 'var(--kn-r-lg)',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'background .15s, border-color .15s',
        display: 'flex', alignItems: 'center', gap: 16,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--kn-r-md)',
        background: 'var(--kn-accent-bg)',
        border: '1px solid color-mix(in oklab, var(--kn-accent) 20%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={statusIcon} size={20} color="var(--kn-accent)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            fontSize: 14, fontWeight: 'var(--kn-w-bold)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
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

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [roomLoading, setRoomLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const joinInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    RoomAPI.list(user.id).then((res) => {
      if (res.success && res.data) setRooms(res.data);
      setRoomLoading(false);
    });
  }, [user]);

  if (authLoading || !user) return null;

  const handleRoomClick = (room) => {
    const code = room.roomCode || room.code;
    if (room.status === 'WAITING') router.push(`/room/${code}/setup`);
    else if (room.status === 'IN_PROGRESS' || room.status === 'LIVE') router.push(`/room/${code}/live`);
    else router.push(`/room/${code}/result`);
  };

  const handleCodeChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (val && !val.startsWith('#')) val = `#${val}`;
    const body = val.slice(1).replace(/[^A-Z0-9]/g, '');
    val = body ? `#${body}` : '';
    if (val.length > 7) val = val.slice(0, 7);
    setJoinCode(val);
    setJoinError('');
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setJoinError('초대 코드를 입력해주세요');
      joinInputRef.current?.focus();
      return;
    }
    setJoining(true);
    setJoinError('');
    const res = await RoomAPI.joinByCode(joinCode, user);
    setJoining(false);
    if (!res.success) {
      setJoinError(res.message || '참여에 실패했습니다');
      return;
    }
    const roomCode = res.data?.code || res.data?.roomCode;
    if (roomCode) router.push(`/room/${roomCode}/setup`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, padding: '28px 32px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
        {/* page title */}
        <div style={{ marginBottom: 20 }}>
          <span data-label="">Dashboard</span>
          <div style={{ fontSize: 28, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.02em', marginTop: 4 }}>
            오늘은 무슨 판을 깔까요?
          </div>
        </div>

        {/* action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          {/* create room */}
          <div style={{
            background: 'var(--kn-surface-1)',
            border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-lg)',
            padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="plus" size={20} color="var(--kn-accent)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)' }}>새 방 만들기</div>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>룰을 잡고 팀을 짜세요</div>
              </div>
            </div>
            <Link href="/room/create" style={{ display: 'block' }}>
              <Button variant="primary" fullWidth icon="plus">방 만들기</Button>
            </Link>
          </div>

          {/* join by code */}
          <div style={{
            background: 'var(--kn-surface-1)',
            border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-lg)',
            padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="key" size={20} color="var(--kn-accent)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)' }}>초대 코드로 참여</div>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>방장한테 받은 코드를 입력</div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  ref={joinInputRef}
                  value={joinCode}
                  onChange={handleCodeChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="#000000"
                  maxLength={8}
                  style={{
                    flex: 1, minWidth: 0, height: 36, padding: '0 12px',
                    background: 'var(--kn-surface-3)',
                    border: `1px solid ${joinError ? 'var(--kn-danger)' : 'var(--kn-border)'}`,
                    color: 'var(--kn-accent)',
                    borderRadius: 'var(--kn-r-md)',
                    fontFamily: 'var(--kn-font-mono)',
                    fontSize: 14, fontWeight: 'var(--kn-w-bold)', letterSpacing: '0.15em',
                    outline: 'none',
                  }}
                />
                <Button variant="secondary" onClick={handleJoin} loading={joining} disabled={joinCode.length < 4}>
                  참여
                </Button>
              </div>
              {joinError && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--kn-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="alert" size={13} /> {joinError}
                </div>
              )}
              {!joinError && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--kn-text-dim)' }}>
                  형식: #000000 · 팀 구성 화면에서 코드를 확인하세요
                </div>
              )}
            </div>
          </div>
        </div>

        {/* rooms list */}
        <section>
          <div style={{
            marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <span data-label="">내 방 · {rooms.length > 0 ? rooms.length : ''}</span>
          </div>

          {roomLoading && (
            <div style={{
              background: 'var(--kn-surface-1)',
              border: '1px solid var(--kn-border)',
              borderRadius: 'var(--kn-r-lg)',
              padding: 40, textAlign: 'center', color: 'var(--kn-text-muted)', fontSize: 13,
            }}>
              <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite', marginBottom: 8 }} />
              <div>불러오는 중...</div>
            </div>
          )}

          {!roomLoading && rooms.length === 0 && (
            <div style={{
              background: 'var(--kn-surface-1)',
              border: '1px dashed var(--kn-border)',
              borderRadius: 'var(--kn-r-lg)',
              padding: 40, textAlign: 'center',
            }}>
              <Icon name="grid" size={28} color="var(--kn-text-dim)" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, color: 'var(--kn-text-muted)', marginBottom: 4 }}>참여한 방이 없습니다</div>
              <div style={{ fontSize: 12, color: 'var(--kn-text-dim)' }}>방을 만들거나 초대 코드로 참여해보세요</div>
            </div>
          )}

          {!roomLoading && rooms.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
