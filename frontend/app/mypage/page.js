/**
 * ============================================================
 *  마이페이지  /mypage
 * ============================================================
 *
 *  [화면 구성]
 *   - 헤더 (로고 + 대시보드 링크 + 로그아웃)
 *   - 프로필 카드 (아이디, 가입일, 아바타)
 *   - 통계 요약 (총 킬내기 수, 승리, 패배, 승률)
 *   - 최근 킬내기 목록 (최대 5개)
 *   - 계정 설정 (비밀번호 변경)
 *
 *  [API 호출]
 *   AuthAPI.getProfile()      — 내 프로필 (가입일 포함)
 *   AuthAPI.changePassword()  — 비밀번호 변경
 *   RoomAPI.list(userId)      — 내가 참여한 방 목록
 *   RoomAPI.getMatches(roomId)— 완료된 각 방의 매치 데이터 (승/패 계산용)
 *
 *  [승/패 판정 기준]
 *   - 완료된 방(DONE) 중 내가 팀 멤버로 참여한 방만 집계
 *   - 내 팀의 총점(킬+보너스-패널티+조정)이 가장 높으면 승리
 *   - 동점 1위면 승리로 처리
 *
 * ============================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';
import { useAuth }             from '@/lib/auth-context';
import { AuthAPI }             from '@/lib/api';
import { RoomAPI }             from '@/lib/room-api';
import Button                  from '@/components/ui/Button';

// ─────────────────────────────────────────
//  팀 총점 계산 (승/패 판정용)
//  live/page.js 와 동일 로직 — match.teamId 기준 필터
// ─────────────────────────────────────────

function calcTeamTotal(teamId, matches, rule, adjustments = []) {
  let kills = 0, bonus = 0, penalty = 0;

  for (const m of matches.filter((m) => m.teamId === teamId)) {
    if (rule.chickenBonusOn && m.chickenTeamId === teamId) bonus += rule.chickenBonus;
    for (const r of m.results) {
      kills += r.kills;
      if (rule.headShotBonusOn  && r.headShot)   bonus   += rule.headShotBonus;
      if (rule.assistBonusOn    && r.assist)      bonus   += rule.assistBonus;
      if (rule.teamKillPenaltyOn)                 penalty += (r.teamKills || 0) * rule.teamKillPenalty;
      if (rule.deathPenaltyOn   && r.earlyDeath)  penalty += rule.deathPenalty;
    }
  }

  const adj = (adjustments || [])
    .filter((a) => a.teamId === teamId)
    .reduce((s, a) => s + a.amount, 0);

  return kills + bonus - penalty + adj;
}

// ─────────────────────────────────────────
//  방 상태 배지
// ─────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    WAITING: { label: '대기 중', color: '#8A8060', bg: 'rgba(138,128,96,0.1)' },
    LIVE:    { label: '진행 중', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)'  },
    DONE:    { label: '종료됨',  color: '#555',    bg: 'rgba(80,80,80,0.1)'   },
  };
  const s = map[status] || map.DONE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, border: `1px solid ${s.color}44`,
      borderRadius: 4, padding: '2px 7px', fontSize: 10, color: s.color,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: s.color,
        animation: status === 'LIVE' ? 'pulse 1.5s infinite' : 'none',
        flexShrink: 0,
      }} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────
//  통계 카드
// ─────────────────────────────────────────

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: '#1C1A0C',
      border: `1px solid ${accent ? 'rgba(245,166,35,0.3)' : 'rgba(200,155,0,0.15)'}`,
      borderRadius: 8, padding: '16px 18px',
      flex: 1, minWidth: 100,
    }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 36, fontWeight: 900,
        color: accent ? '#F5A623' : '#E8DFC0',
        lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#8A8060' }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────
//  최근 방 카드 (간소화 버전)
// ─────────────────────────────────────────

function RecentRoomCard({ room, onClick }) {
  const totalPlayers = room.teams.reduce((s, t) => s + (t.players?.length || 0), 0);
  const dateStr = new Date(room.createdAt).toLocaleDateString('ko', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(200,155,0,0.4)'; e.currentTarget.style.background = '#222010'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(200,155,0,0.15)'; e.currentTarget.style.background = '#1C1A0C'; }}
      style={{
        background: '#1C1A0C',
        border: '1px solid rgba(200,155,0,0.15)',
        borderRadius: 8, padding: '14px 18px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color .15s, background .15s',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 6, flexShrink: 0,
        background: 'rgba(200,155,0,0.07)', border: '1px solid rgba(200,155,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {room.status === 'LIVE' ? '🎯' : room.status === 'DONE' ? '🏆' : '⏳'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.title}
          </div>
          <StatusBadge status={room.status} />
        </div>
        <div style={{ fontSize: 11, color: '#8A8060', display: 'flex', gap: 10 }}>
          <span>{room.rule?.gameMode}</span>
          <span>{room.teams.length}팀 · {totalPlayers}명</span>
          <span>{dateStr}</span>
        </div>
      </div>
      <div style={{ color: '#555', fontSize: 16, flexShrink: 0 }}>›</div>
    </div>
  );
}

// ─────────────────────────────────────────
//  비밀번호 변경 섹션
// ─────────────────────────────────────────

function PasswordSection() {
  const [open,        setOpen]        = useState(false);
  const [current,     setCurrent]     = useState('');
  const [next,        setNext]        = useState('');
  const [nextConfirm, setNextConfirm] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    // 기본 유효성 검사
    if (!current)                          return setError('현재 비밀번호를 입력해주세요');
    if (next.length < 4)                   return setError('새 비밀번호는 최소 4자 이상이어야 합니다');
    if (next !== nextConfirm)              return setError('새 비밀번호가 일치하지 않습니다');
    if (current === next)                  return setError('현재 비밀번호와 새 비밀번호가 같습니다');

    setLoading(true);
    const res = await AuthAPI.changePassword(current, next);
    setLoading(false);

    if (!res.ok) return setError(res.error);

    // 성공
    setSuccess(true);
    setCurrent(''); setNext(''); setNextConfirm('');
    setTimeout(() => { setSuccess(false); setOpen(false); }, 1800);
  };

  return (
    <div style={{
      background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      {/* 헤더 (클릭하면 열고 닫음) */}
      <div
        onClick={() => { setOpen((v) => !v); setError(''); setSuccess(false); }}
        style={{
          padding: '16px 20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🔐</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>비밀번호 변경</div>
            <div style={{ fontSize: 11, color: '#8A8060', marginTop: 1 }}>현재 비밀번호를 확인 후 변경합니다</div>
          </div>
        </div>
        <span style={{ color: '#8A8060', fontSize: 14, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </div>

      {/* 입력 폼 (open일 때만) */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(200,155,0,0.08)' }}>
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* 현재 비밀번호 */}
            <div>
              <div style={{ fontSize: 11, color: '#8A8060', marginBottom: 6 }}>현재 비밀번호</div>
              <input
                type="password" value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="현재 비밀번호"
                style={inputStyle}
              />
            </div>

            {/* 새 비밀번호 */}
            <div>
              <div style={{ fontSize: 11, color: '#8A8060', marginBottom: 6 }}>새 비밀번호 (4자 이상)</div>
              <input
                type="password" value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="새 비밀번호"
                style={inputStyle}
              />
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <div style={{ fontSize: 11, color: '#8A8060', marginBottom: 6 }}>새 비밀번호 확인</div>
              <input
                type="password" value={nextConfirm}
                onChange={(e) => setNextConfirm(e.target.value)}
                placeholder="새 비밀번호 다시 입력"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={inputStyle}
              />
            </div>

            {/* 에러/성공 메시지 */}
            {error && (
              <div style={{ fontSize: 12, color: '#E53935', padding: '8px 12px', background: 'rgba(229,57,53,0.08)', borderRadius: 4, border: '1px solid rgba(229,57,53,0.2)' }}>
                ⚠ {error}
              </div>
            )}
            {success && (
              <div style={{ fontSize: 12, color: '#4CAF50', padding: '8px 12px', background: 'rgba(76,175,80,0.08)', borderRadius: 4, border: '1px solid rgba(76,175,80,0.2)' }}>
                ✓ 비밀번호가 변경되었습니다
              </div>
            )}

            {/* 버튼 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 4 }}>
              <Button variant="secondary" onClick={() => { setOpen(false); setError(''); }}>취소</Button>
              <Button onClick={handleSubmit} loading={loading}>변경하기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// input 공통 스타일
const inputStyle = {
  width: '100%', background: '#141200',
  border: '1px solid rgba(200,155,0,0.25)',
  color: '#E8DFC0', padding: '10px 12px',
  borderRadius: 4, fontSize: 13, outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

// ─────────────────────────────────────────
//  메인 페이지
// ─────────────────────────────────────────

export default function MyPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [profile,  setProfile]  = useState(null);   // 가입일 등 상세 정보
  const [rooms,    setRooms]    = useState([]);
  const [wld,      setWld]      = useState(null);    // { wins, losses } — null = 계산 중
  const [loading,  setLoading]  = useState(true);

  // ── 로그인 체크 ──
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  // ── 1단계: 프로필 + 방 목록 로드 ──
  useEffect(() => {
    if (!user) return;
    Promise.all([
      AuthAPI.getProfile(),
      RoomAPI.list(user.id),
    ]).then(([profileRes, roomsRes]) => {
      if (profileRes.ok) setProfile(profileRes.user);
      if (roomsRes.ok)   setRooms(roomsRes.rooms);
      setLoading(false);
    });
  }, [user]);

  // ── 2단계: 완료된 방의 매치 데이터로 승/패 계산 ──
  // rooms 로드가 끝난 뒤 DONE 방들의 매치를 병렬로 가져와서 집계
  useEffect(() => {
    if (!user || loading) return;

    const doneRooms = rooms.filter((r) => r.status === 'DONE');
    if (doneRooms.length === 0) { setWld({ wins: 0, losses: 0 }); return; }

    Promise.all(
      doneRooms.map((room) =>
        RoomAPI.getMatches(room.id).then((res) => ({
          room,
          matches: res.ok ? res.matches : [],
        }))
      )
    ).then((results) => {
      let wins = 0, losses = 0;

      for (const { room, matches } of results) {
        // 내가 속한 팀 찾기 (team.members 기준)
        const myTeam = room.teams.find((t) =>
          t.members?.some((m) => m.userId === user.id)
        );
        if (!myTeam) continue; // 팀 멤버십 없으면 집계 제외

        // 모든 팀의 총점 계산
        const scores = room.teams.map((t) => ({
          teamId: t.id,
          total:  calcTeamTotal(t.id, matches, room.rule, room.adjustments),
        }));

        const maxScore = Math.max(...scores.map((s) => s.total));
        const myScore  = scores.find((s) => s.teamId === myTeam.id)?.total ?? 0;

        // 내 팀이 공동 1위 이상이면 승리
        if (myScore >= maxScore) wins++;
        else                      losses++;
      }

      setWld({ wins, losses });
    });
  }, [rooms, loading, user]);

  // ── 로그아웃 ──
  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // ── 방 클릭 → 상태에 따라 이동 ──
  const handleRoomClick = (room) => {
    if (room.status === 'WAITING') router.push(`/room/${room.id}/setup`);
    else if (room.status === 'LIVE') router.push(`/room/${room.id}/live`);
    else router.push(`/room/${room.id}/result`);
  };

  if (authLoading || !user) return null;

  // ── 통계 계산 ──
  const totalRooms = rooms.length;
  const liveRooms  = rooms.filter((r) => r.status === 'LIVE').length;
  const wins       = wld?.wins   ?? 0;
  const losses     = wld?.losses ?? 0;
  const played     = wins + losses;  // 승/패가 집계된 판 수
  // 승률: 집계된 게임이 있을 때만 계산, 없으면 '—'
  const winRateStr = played > 0 ? `${Math.round((wins / played) * 100)}%` : '—';

  // 최근 5개만 표시
  const recentRooms = rooms.slice(0, 5);

  // 가입일 포맷
  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <div style={{
        background: '#1C1A0C', borderBottom: '1px solid rgba(200,155,0,0.18)',
        padding: '0 24px', height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 22, fontWeight: 900, fontStyle: 'italic',
            color: '#F5A623', letterSpacing: 2, cursor: 'pointer',
          }}>
            KILL CHALLENGE
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: '#8A8060', textDecoration: 'none' }}>
            대시보드
          </Link>
          <button
            onClick={handleLogout}
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
          <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 3, marginBottom: 6 }}>MY PAGE</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 34, fontWeight: 900, fontStyle: 'italic',
          }}>
            마이페이지
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#8A8060', fontSize: 13, textAlign: 'center', padding: '60px 0' }}>
            불러오는 중...
          </div>
        ) : (
          <>
            {/* ── 프로필 카드 ── */}
            <div style={{
              background: '#1C1A0C',
              border: '1px solid rgba(200,155,0,0.22)',
              borderRadius: 10, padding: '24px',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
              {/* 아바타 (이니셜) */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(245,166,35,0.12)',
                border: '2px solid rgba(245,166,35,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 28, fontWeight: 900, color: '#F5A623',
                flexShrink: 0, userSelect: 'none',
              }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 26, fontWeight: 900, marginBottom: 4,
                }}>
                  {user.username}
                </div>
                <div style={{ fontSize: 11, color: '#8A8060', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>아이디: <b style={{ color: '#E8DFC0' }}>{user.username}</b></span>
                  <span>가입일: <b style={{ color: '#E8DFC0' }}>{joinedDate}</b></span>
                </div>
              </div>

              {/* 빠른 이동 버튼 */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">대시보드</Button>
                </Link>
                <Link href="/room/create">
                  <Button size="sm">+ 방 만들기</Button>
                </Link>
              </div>
            </div>

            {/* ── 통계 카드 ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard icon="🎯" label="총 킬내기"  value={totalRooms}  accent={totalRooms > 0} />
              <StatCard icon="⚡" label="진행 중"    value={liveRooms}   accent={false} />
              {/* 승/패는 wld 계산이 끝날 때까지 '...' 표시 */}
              <StatCard icon="🏆" label="승리"       value={wld ? wins    : '…'} accent={wins > 0} />
              <StatCard icon="💀" label="패배"       value={wld ? losses  : '…'} accent={false} />
              <StatCard icon="📊" label="승률"       value={wld ? winRateStr : '…'} accent={false} />
            </div>

            {/* ── 최근 킬내기 ── */}
            <section style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>최근 킬내기</span>
                {rooms.length > 5 && (
                  <Link href="/dashboard" style={{ fontSize: 11, color: '#F5A623', textDecoration: 'none' }}>
                    전체 보기 ({rooms.length}개) →
                  </Link>
                )}
              </div>

              {recentRooms.length === 0 ? (
                <div style={{
                  background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.12)',
                  borderRadius: 8, padding: '40px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>아직 참여한 킬내기가 없어요</div>
                  <div style={{ fontSize: 12, color: '#8A8060', marginBottom: 20 }}>
                    첫 번째 킬내기를 시작해보세요!
                  </div>
                  <Link href="/room/create">
                    <Button size="sm">+ 방 만들기</Button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentRooms.map((room) => (
                    <RecentRoomCard key={room.id} room={room} onClick={() => handleRoomClick(room)} />
                  ))}
                </div>
              )}
            </section>

            {/* ── 계정 설정 ── */}
            <section>
              <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 12 }}>
                계정 설정
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* 비밀번호 변경 */}
                <PasswordSection />

                {/* 로그아웃 */}
                <div style={{
                  background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)',
                  borderRadius: 8, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>🚪</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>로그아웃</div>
                      <div style={{ fontSize: 11, color: '#8A8060', marginTop: 1 }}>현재 기기에서 로그아웃합니다</div>
                    </div>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleLogout}>로그아웃</Button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
