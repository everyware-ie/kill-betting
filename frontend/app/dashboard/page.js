'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import useDashboard from '@/features/dashboard/hooks/useDashboard';
import RoomCard from '@/features/dashboard/components/RoomCard';

export default function DashboardPage() {
  const router = useRouter();
  const {
    user, authLoading,
    rooms, roomLoading,
    joinCode, joining, joinError, joinInputRef,
    handleRoomClick, handleCodeChange, handleJoin,
  } = useDashboard();

  if (authLoading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, padding: '28px 32px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>

        {/* 타이틀 */}
        <div style={{ marginBottom: 20 }}>
          <span data-label="">Dashboard</span>
          <div style={{ fontSize: 28, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.02em', marginTop: 4 }}>
            오늘은 무슨 판을 깔까요?
          </div>
        </div>

        {/* 액션 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>

          {/* 방 만들기 */}
          <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          {/* 초대 코드로 참여 */}
          <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  style={{ flex: 1, minWidth: 0, height: 36, padding: '0 12px', background: 'var(--kn-surface-3)', border: `1px solid ${joinError ? 'var(--kn-danger)' : 'var(--kn-border)'}`, color: 'var(--kn-accent)', borderRadius: 'var(--kn-r-md)', fontFamily: 'var(--kn-font-mono)', fontSize: 14, fontWeight: 'var(--kn-w-bold)', letterSpacing: '0.15em', outline: 'none' }}
                />
                <Button variant="secondary" onClick={handleJoin} loading={joining} disabled={joinCode.length < 4}>참여</Button>
              </div>
              {joinError ? (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--kn-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="alert" size={13} /> {joinError}
                </div>
              ) : (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--kn-text-dim)' }}>
                  형식: #000000 · 팀 구성 화면에서 코드를 확인하세요
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 내 방 목록 */}
        <section>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span data-label="">내 방 · {rooms.length > 0 ? rooms.length : ''}</span>
          </div>

          {roomLoading && (
            <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: 40, textAlign: 'center', color: 'var(--kn-text-muted)', fontSize: 13 }}>
              <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite', marginBottom: 8 }} />
              <div>불러오는 중...</div>
            </div>
          )}

          {!roomLoading && rooms.length === 0 && (
            <div style={{ background: 'var(--kn-surface-1)', border: '1px dashed var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: 40, textAlign: 'center' }}>
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
