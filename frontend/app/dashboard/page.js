/**
 * ============================================================
 *  대시보드 페이지  /dashboard
 * ============================================================
 *
 *  [화면 구성]
 *   - 상단 헤더 (로그인 유저명 + 로그아웃)
 *   - [방 만들기] / [초대 코드로 참여] 카드 (2열 그리드)
 *   - 내 방 목록 (최신순, 상태 배지 포함)
 *     · WAITING  — 대기 중 (팀 구성 화면으로 이동)
 *     · LIVE     — 진행 중 (라이브 스코어보드로 이동)
 *     · DONE     — 종료됨 (결과 페이지로 이동)
 *
 *  [API 호출]
 *   RoomAPI.list(userId)      — 내가 참여한 방 목록 조회
 *   RoomAPI.joinByCode(code)  — 초대 코드로 방 참여
 *
 * ============================================================
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter }  from 'next/navigation';
import Link           from 'next/link';
import { useAuth }    from '@/lib/auth-context';
import { RoomAPI }    from '@/lib/room-api';
import Button         from '@/components/ui/Button';

// ─────────────────────────────────────────
//  상태 배지 컴포넌트
// ─────────────────────────────────────────

/** 방 상태를 색상 배지로 표시 */
function StatusBadge({ status }) {
  const map = {
    WAITING: { label: '대기 중', color: '#8A8060', bg: 'rgba(138,128,96,0.1)', dot: '#8A8060' },
    LIVE:    { label: '진행 중', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)',  dot: '#4CAF50' },
    DONE:    { label: '종료됨',  color: '#555',    bg: 'rgba(80,80,80,0.1)',   dot: '#555'    },
  };
  const s = map[status] || map.DONE;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, border: `1px solid ${s.color}33`,
      borderRadius: 4, padding: '3px 8px', fontSize: 11, color: s.color,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: s.dot,
        animation: status === 'LIVE' ? 'pulse 1.5s infinite' : 'none',
      }} />
      {s.label}
    </div>
  );
}

// ─────────────────────────────────────────
//  방 카드 컴포넌트
// ─────────────────────────────────────────

/** 방 목록에서 각 방을 표시하는 카드 */
function RoomCard({ room, onClick }) {
  const totalPlayers = room.teams.reduce((s, t) => s + (t.players?.length || 0), 0);
  const teamCount    = room.teams.length;

  const createdAt = new Date(room.createdAt).toLocaleString('ko', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      onClick={onClick}
      style={{
        background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.18)',
        borderRadius: 8, padding: '16px 20px', cursor: 'pointer',
        transition: 'border-color .15s, background .15s',
        display: 'flex', alignItems: 'center', gap: 16,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(200,155,0,0.45)'; e.currentTarget.style.background = '#222010'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(200,155,0,0.18)'; e.currentTarget.style.background = '#1C1A0C'; }}
    >
      {/* 아이콘 */}
      <div style={{
        width: 44, height: 44, borderRadius: 8,
        background: 'rgba(200,155,0,0.07)', border: '1px solid rgba(200,155,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {room.status === 'LIVE' ? '🎯' : room.status === 'DONE' ? '🏆' : '⏳'}
      </div>

      {/* 방 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.title}
          </div>
          <StatusBadge status={room.status} />
        </div>
        <div style={{ fontSize: 11, color: '#8A8060', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>{room.rule?.gameMode}</span>
          <span>{teamCount}팀 · {totalPlayers}명</span>
          <span>목표 {room.rule?.targetKills}킬</span>
          <span>{createdAt}</span>
        </div>
      </div>

      {/* 이동 화살표 */}
      <div style={{ color: '#8A8060', fontSize: 18, flexShrink: 0 }}>›</div>
    </div>
  );
}

// ─────────────────────────────────────────
//  메인 페이지
// ─────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // 방 목록 상태
  const [rooms,       setRooms]       = useState([]);
  const [roomLoading, setRoomLoading] = useState(true);

  // 초대 코드 입력 상태
  const [joinCode,    setJoinCode]    = useState('');
  const [joining,     setJoining]     = useState(false);
  const [joinError,   setJoinError]   = useState('');
  const joinInputRef = useRef(null);

  // ── 로그인 체크 ──
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  // ── 방 목록 불러오기 ──
  useEffect(() => {
    if (!user) return;
    RoomAPI.list(user.id).then((res) => {
      if (res.ok) setRooms(res.rooms);
      setRoomLoading(false);
    });
  }, [user]);

  if (authLoading || !user) return null;

  // ── 방 클릭 시 상태에 따라 다른 페이지로 이동 ──
  const handleRoomClick = (room) => {
    if (room.status === 'WAITING') router.push(`/room/${room.id}/setup`);
    else if (room.status === 'LIVE') router.push(`/room/${room.id}/live`);
    else router.push(`/room/${room.id}/result`);
  };

  // ── 초대 코드 입력 처리 ──
  // '#' 입력 시 자동 붙여주고, 숫자·대시만 허용 (예: #1234-56 → 최대 8자)
  const handleCodeChange = (e) => {
    let val = e.target.value.toUpperCase();

    // '#'으로 시작하지 않으면 앞에 붙임
    if (val && !val.startsWith('#')) val = `#${val}`;

    // '#' 이후 숫자와 '-'만 허용
    const body = val.slice(1).replace(/[^0-9-]/g, '');
    val = body ? `#${body}` : '';

    // 최대 8자 (#0000-00)
    if (val.length > 8) val = val.slice(0, 8);

    setJoinCode(val);
    setJoinError('');
  };

  // ── 초대 코드 참여 제출 ──
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

    if (!res.ok) {
      setJoinError(res.error);
      return;
    }

    // 참여 성공 → 방 목록에 즉시 추가 후 이동
    const room = res.room;
    setRooms((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      return exists ? prev : [room, ...prev];
    });

    // 방 상태에 따라 이동
    if (room.status === 'WAITING') router.push(`/room/${room.id}/setup`);
    else if (room.status === 'LIVE') router.push(`/room/${room.id}/live`);
    else router.push(`/room/${room.id}/result`);
  };

  // Enter 키로 참여
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <div style={{
        background: '#1C1A0C', borderBottom: '1px solid rgba(200,155,0,0.18)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 22, fontWeight: 900, fontStyle: 'italic',
          color: '#F5A623', letterSpacing: 2,
        }}>
          KILL CHALLENGE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/mypage" style={{ fontSize: 12, color: '#8A8060', textDecoration: 'none' }}>
            {user.username}
          </Link>
          <button
            onClick={logout}
            style={{
              background: 'none', border: '1px solid rgba(200,155,0,0.2)',
              color: '#8A8060', padding: '5px 12px',
              borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* 페이지 타이틀 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 3, marginBottom: 6 }}>DASHBOARD</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 34, fontWeight: 900, fontStyle: 'italic',
          }}>
            안녕하세요, {user.username}
          </div>
        </div>

        {/* ── 방 만들기 / 참여하기 2열 그리드 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>

          {/* 방 만들기 카드 */}
          <div style={{
            background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.2)',
            borderRadius: 10, padding: '22px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>🎯</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>새 방 만들기</div>
                <div style={{ fontSize: 12, color: '#8A8060', lineHeight: 1.6 }}>
                  룰을 설정하고 팀을 구성해<br />킬내기를 시작하세요.
                </div>
              </div>
            </div>
            <Link href="/room/create" style={{ display: 'block' }}>
              <Button style={{ width: '100%' }}>+ 방 만들기</Button>
            </Link>
          </div>

          {/* 초대 코드로 참여 카드 */}
          <div style={{
            background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.2)',
            borderRadius: 10, padding: '22px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>🔑</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>초대 코드로 참여</div>
                <div style={{ fontSize: 12, color: '#8A8060', lineHeight: 1.6 }}>
                  방장에게 받은 초대 코드를<br />입력하고 팀에 합류하세요.
                </div>
              </div>
            </div>

            {/* 코드 입력 + 참여 버튼 */}
            <div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={joinInputRef}
                  value={joinCode}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder="#1234-56"
                  maxLength={8}
                  style={{
                    flex: 1,
                    background: '#141200',
                    border: `1px solid ${joinError ? 'rgba(229,57,53,0.6)' : 'rgba(200,155,0,0.25)'}`,
                    color: '#F5A623',
                    padding: '9px 12px',
                    borderRadius: 4,
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 3,
                    outline: 'none',
                    fontFamily: "'Share Tech Mono', monospace",
                    width: 0,          // flex가 너비를 결정하도록
                    minWidth: 0,
                  }}
                />
                <Button
                  onClick={handleJoin}
                  loading={joining}
                  disabled={joinCode.length < 4}
                  style={{ flexShrink: 0 }}
                >
                  참여
                </Button>
              </div>

              {/* 오류 메시지 */}
              {joinError && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#E53935', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ⚠ {joinError}
                </div>
              )}

              {/* 코드 형식 안내 */}
              {!joinError && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#555' }}>
                  형식: #0000-00 · 팀 구성 화면에서 코드를 확인하세요
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 내 방 목록 ── */}
        <section>
          <div style={{
            fontSize: 11, color: '#8A8060', letterSpacing: 2,
            marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>내 방 목록</span>
            {rooms.length > 0 && <span style={{ fontWeight: 400 }}>{rooms.length}개</span>}
          </div>

          {/* 로딩 중 */}
          {roomLoading && (
            <div style={{
              background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.12)',
              borderRadius: 10, padding: '40px', textAlign: 'center', color: '#555', fontSize: 13,
            }}>
              불러오는 중...
            </div>
          )}

          {/* 방이 없을 때 */}
          {!roomLoading && rooms.length === 0 && (
            <div style={{
              background: '#1C1A0C', border: '1px dashed rgba(200,155,0,0.12)',
              borderRadius: 10, padding: '40px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>참여한 방이 없습니다</div>
              <div style={{ fontSize: 12, color: '#444' }}>방을 만들거나 초대 코드로 참여해보세요</div>
            </div>
          )}

          {/* 방 카드 목록 */}
          {!roomLoading && rooms.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room)} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* LIVE 상태 점멸 애니메이션 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
