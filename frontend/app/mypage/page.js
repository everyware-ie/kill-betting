'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AuthAPI } from '@/lib/api';
import { RoomAPI } from '@/lib/room-api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';
import Navbar from '@/components/layout/Navbar';

function calcTeamTotal(teamId, matches, rule, adjustments = []) {
  let kills = 0, bonus = 0, penalty = 0;

  for (const m of matches.filter((m) => m.teamId === teamId)) {
    if (rule.chickenBonusOn && m.chickenTeamId === teamId) bonus += rule.chickenBonus;
    for (const r of m.results) {
      kills += r.kills;
      if (rule.headShotBonusOn && r.headShot) bonus += rule.headShotBonus;
      if (rule.assistBonusOn && r.assist) bonus += rule.assistBonus;
      if (rule.teamKillPenaltyOn) penalty += (r.teamKills || 0) * rule.teamKillPenalty;
      if (rule.deathPenaltyOn && r.earlyDeath) penalty += rule.deathPenalty;
    }
  }

  const adj = (adjustments || [])
    .filter((a) => a.teamId === teamId)
    .reduce((s, a) => s + a.amount, 0);

  return kills + bonus - penalty + adj;
}

function KnSection({ title, hint, children, style }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span data-label="">{title}</span>
          {hint && <span style={{ fontSize: 11, color: 'var(--kn-text-dim)' }}>{hint}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [nextConfirm, setNextConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    if (!current) return setError('현재 비밀번호를 입력해주세요');
    if (next.length < 4) return setError('새 비밀번호는 최소 4자 이상이어야 합니다');
    if (next !== nextConfirm) return setError('새 비밀번호가 일치하지 않습니다');
    if (current === next) return setError('현재 비밀번호와 새 비밀번호가 같습니다');

    setLoading(true);
    const res = await AuthAPI.changePassword(current, next);
    setLoading(false);

    if (!res.ok) return setError(res.error);

    setSuccess(true);
    setCurrent(''); setNext(''); setNextConfirm('');
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)', marginBottom: 8 }}>비밀번호 변경</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Input type="password" placeholder="현재 비밀번호" prefix="lock"
          value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Input type="password" placeholder="새 비밀번호 (최소 4자)" prefix="key"
          value={next} onChange={(e) => setNext(e.target.value)} />
        <Input type="password" placeholder="새 비밀번호 확인" prefix="key"
          value={nextConfirm} onChange={(e) => setNextConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />

        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--kn-r-md)',
            background: 'color-mix(in oklab, var(--kn-danger) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--kn-danger) 25%, transparent)',
            fontSize: 12, color: 'var(--kn-danger)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="alert" size={13} /> {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--kn-r-md)',
            background: 'color-mix(in oklab, var(--kn-success) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--kn-success) 25%, transparent)',
            fontSize: 12, color: 'var(--kn-success)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="check" size={13} /> 비밀번호가 변경되었습니다
          </div>
        )}

        <Button variant="primary" onClick={handleSubmit} loading={loading}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          비밀번호 변경
        </Button>
      </div>
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [wld, setWld] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      AuthAPI.getProfile(),
      RoomAPI.list(user.id),
    ]).then(([profileRes, roomsRes]) => {
      if (profileRes.ok) setProfile(profileRes.user);
      if (roomsRes.ok) setRooms(roomsRes.rooms);
      setLoading(false);
    });
  }, [user]);

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
        const myTeam = room.teams.find((t) =>
          t.members?.some((m) => m.userId === user.id)
        );
        if (!myTeam) continue;
        const scores = room.teams.map((t) => ({
          teamId: t.id,
          total: calcTeamTotal(t.id, matches, room.rule, room.adjustments),
        }));
        const maxScore = Math.max(...scores.map((s) => s.total));
        const myScore = scores.find((s) => s.teamId === myTeam.id)?.total ?? 0;
        if (myScore >= maxScore) wins++;
        else losses++;
      }
      setWld({ wins, losses });
    });
  }, [rooms, loading, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (authLoading || !user) return null;

  const wins = wld?.wins ?? 0;
  const losses = wld?.losses ?? 0;
  const played = wins + losses;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '18px 32px',
        borderBottom: '1px solid var(--kn-border)',
        background: 'var(--kn-surface-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/dashboard')} style={{
            width: 32, height: 32, background: 'transparent',
            border: '1px solid var(--kn-border-strong)',
            color: 'var(--kn-text-muted)', borderRadius: 'var(--kn-r-md)',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="back" size={16} />
          </button>
          <div>
            <div data-label="" style={{ fontSize: 10 }}>USER COMMAND</div>
            <div style={{ fontSize: 17, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.01em' }}>마이페이지</div>
          </div>
        </div>
        <Button variant="secondary" icon="logout" onClick={handleLogout}>로그아웃</Button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-text-muted)' }}>
          <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite' }} />
        </div>
      ) : (
        <div style={{
          flex: 1, overflow: 'auto', padding: '28px 32px',
          maxWidth: 720, margin: '0 auto', width: '100%',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {/* profile header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: 20,
            background: 'var(--kn-surface-1)',
            border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-xl)',
          }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--kn-accent-bg)',
              border: '1px solid color-mix(in oklab, var(--kn-accent) 30%, transparent)',
              borderRadius: '50%',
              display: 'grid', placeItems: 'center',
            }}>
              <Icon name="user" size={28} color="var(--kn-accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <span data-label="">현재 아이디</span>
              <div style={{
                fontSize: 22, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.01em',
                marginTop: 2, fontFamily: 'var(--kn-font-mono)',
              }}>
                {user.username}
              </div>
            </div>
          </div>

          {/* stats */}
          <KnSection title="킬내기 전적">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { lbl: '총 게임', v: wld ? played : '...', color: null },
                { lbl: '승률', v: wld ? `${winRate}%` : '...', color: 'var(--kn-accent)' },
                { lbl: '승', v: wld ? wins : '...', color: 'var(--kn-success)' },
                { lbl: '패', v: wld ? losses : '...', color: 'var(--kn-danger)' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'var(--kn-surface-1)',
                  border: '1px solid var(--kn-border)',
                  borderRadius: 'var(--kn-r-lg)',
                  padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <span data-label="">{s.lbl}</span>
                  <div data-display="" style={{
                    fontSize: 32, color: s.color || 'var(--kn-text)',
                    fontFamily: 'var(--kn-font-mono)',
                  }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            {/* win/loss bar */}
            {wld && played > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{
                  display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden',
                  background: 'var(--kn-surface-3)',
                }}>
                  <div style={{ width: `${winRate}%`, background: 'var(--kn-success)' }} />
                  <div style={{ flex: 1, background: 'var(--kn-danger)', opacity: 0.6 }} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginTop: 6,
                  fontSize: 11, color: 'var(--kn-text-dim)', fontFamily: 'var(--kn-font-mono)',
                }}>
                  <span>{wins}W</span>
                  <span>{losses}L</span>
                </div>
              </div>
            )}
          </KnSection>

          {/* account settings */}
          <KnSection title="계정">
            <div style={{
              background: 'var(--kn-surface-1)',
              border: '1px solid var(--kn-border)',
              borderRadius: 'var(--kn-r-lg)',
              padding: 18,
              display: 'flex', flexDirection: 'column', gap: 18,
            }}>
              {/* change id */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)', marginBottom: 8 }}>아이디 변경</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="새 아이디"
                    style={{
                      flex: 1, height: 36, padding: '0 12px',
                      background: 'var(--kn-surface-3)',
                      border: '1px solid var(--kn-border-strong)',
                      color: 'var(--kn-text)',
                      borderRadius: 'var(--kn-r-md)',
                      fontFamily: 'var(--kn-font-mono)', fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <Button variant="secondary">중복확인</Button>
                  <Button variant="primary" disabled={!newId}>변경</Button>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--kn-border)' }} />

              {/* change password */}
              <PasswordSection />
            </div>
          </KnSection>
        </div>
      )}
    </div>
  );
}
