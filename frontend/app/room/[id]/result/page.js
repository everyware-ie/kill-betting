/**
 * ============================================================
 *  최종 결과 페이지  /room/:id/result
 * ============================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth }  from '@/lib/auth-context';
import { RoomAPI }  from '@/lib/room-api';
import { mapSessionRule } from '@/features/setup/helpers/mappers';
import Button       from '@/components/ui/Button';
import Icon         from '@/components/ui/Icon';

// ─────────────────────────────────────────
//  유틸
// ─────────────────────────────────────────

function getPlayerDamage(nickname, matches) {
  let damage = 0;
  for (const m of matches) {
    for (const r of (m.memberResults || [])) {
      if (r.playerNickname === nickname) damage += r.damage || 0;
    }
  }
  return damage;
}

// ─────────────────────────────────────────
//  순위 배지
// ─────────────────────────────────────────

function RankBadge({ rank }) {
  const styles = {
    1: { bg: 'var(--kn-accent-bg)', border: 'var(--kn-accent)', color: 'var(--kn-accent)', icon: 'trophy' },
    2: { bg: 'var(--kn-surface-3)', border: 'var(--kn-border-strong)', color: 'var(--kn-text-muted)', icon: 'shield' },
    3: { bg: 'var(--kn-surface-3)', border: 'var(--kn-border)', color: 'var(--kn-text-dim)', icon: 'shield' },
  };
  const s = styles[rank] || { bg: 'transparent', border: 'var(--kn-border)', color: 'var(--kn-text-dim)', icon: null };
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: s.bg, border: `1px solid ${s.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, color: s.color, flexShrink: 0,
    }}>
      {s.icon ? <Icon name={s.icon} size={20} color={s.color} /> : `#${rank}`}
    </div>
  );
}

// ─────────────────────────────────────────
//  메인 페이지
// ─────────────────────────────────────────

export default function ResultPage() {
  const router  = useRouter();
  const { id: roomCode } = useParams();
  const { user } = useAuth();

  const [room,       setRoom]       = useState(null);
  const [scoreboard, setScoreboard] = useState(null);
  const [matches,    setMatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!user) return;
    RoomAPI.get(roomCode).then(async (roomRes) => {
      if (!roomRes.success) { setError(roomRes.error); setLoading(false); return; }
      const session = roomRes.data;
      setRoom({ ...session, rule: mapSessionRule(session) });

      const [scoreboardRes, matchRes] = await Promise.all([
        RoomAPI.getScoreboard(session.id),
        RoomAPI.getMatches(session.id),
      ]);
      if (scoreboardRes.success) setScoreboard(scoreboardRes.data);
      if (matchRes.success) setMatches(matchRes.data?.matches || []);
      setLoading(false);
    });
  }, [roomCode, user]);

  useEffect(() => { if (!user) router.push('/auth/login'); }, [user]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-text-muted)' }}>
      <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite' }} />
    </div>
  );
  if (error || !room) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--kn-text)' }}>
      <div style={{ color: 'var(--kn-danger)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="alert" size={18} /> {error || '방을 찾을 수 없습니다'}
      </div>
      <Button variant="secondary" onClick={() => router.push('/dashboard')}>대시보드로</Button>
    </div>
  );

  const { rule } = room;

  // scoreboard API 응답 기반으로 팀 점수 구성
  // TeamScoreResponse: { teamId, teamName, totalKills, ruleScore, adjustmentScore, effectiveKills, members[] }
  const teamScores = scoreboard
    ? [...scoreboard.teams]
        .map((t) => ({
          id:      t.teamId,
          name:    t.teamName,
          kills:   t.totalKills,
          bonus:   Math.max(0, t.ruleScore),
          penalty: Math.max(0, -t.ruleScore),
          adj:     t.adjustmentScore ?? 0,
          total:   t.effectiveKills,
          members: t.members || [],
        }))
        .sort((a, b) => b.total - a.total)
    : [];

  const winner = teamScores[0];

  // MVP: scoreboard members 기반 (누적 킬 기준)
  // MemberScoreResponse: { playerId, playerNickname, totalKills, bonusKills, penaltyKills, effectiveKills }
  const allPlayerStats = (scoreboard?.teams || []).flatMap((t) =>
    (t.members || []).map((m) => ({
      nick:     m.playerNickname,
      teamName: t.teamName,
      kills:    m.totalKills,
      bonus:    m.bonusKills,
      penalty:  m.penaltyKills,
      total:    m.effectiveKills,
      damage:   getPlayerDamage(m.playerNickname, matches),
    }))
  ).sort((a, b) => b.kills - a.kills);

  const mvp = allPlayerStats[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', display: 'flex', flexDirection: 'column' }}>

      {/* 헤더 */}
      <div style={{
        background: 'var(--kn-surface-1)', borderBottom: '1px solid var(--kn-border)',
        padding: '0 24px', height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="trophy" size={22} color="var(--kn-accent)" />
          <div>
            <div data-label="" style={{ fontSize: 10 }}>FINAL RESULT</div>
            <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)' }}>{room.title}</div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>

        {/* 우승 팀 선언 배너 */}
        {winner && (
          <div style={{
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--kn-accent) 12%, transparent) 0%, transparent 60%)',
            border: '1px solid color-mix(in oklab, var(--kn-accent) 40%, transparent)',
            borderRadius: 'var(--kn-r-xl)', padding: '28px 32px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
          }}>
            <Icon name="trophy" size={48} color="var(--kn-accent)" />
            <div style={{ flex: 1 }}>
              <div data-label="" style={{ fontSize: 11, marginBottom: 4 }}>FINAL WINNER</div>
              <div style={{
                fontSize: 36, fontWeight: 'var(--kn-w-black)',
                fontFamily: 'var(--kn-font-mono)',
                color: 'var(--kn-accent)', lineHeight: 1, marginBottom: 6,
              }}>
                {winner.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--kn-text-muted)' }}>
                총 {matches.length}판 진행 &nbsp;·&nbsp; 킬 {winner.kills} &nbsp;+{winner.bonus} &nbsp;-{winner.penalty}
                {winner.adj !== 0 && <> &nbsp;·&nbsp; 조정 {winner.adj > 0 ? '+' : ''}{winner.adj}</>}
              </div>
            </div>
            <div data-display="" style={{
              fontSize: 72, color: 'var(--kn-accent)',
              fontFamily: 'var(--kn-font-mono)',
            }}>
              {winner.total}
            </div>
          </div>
        )}

        {/* MVP 배너 */}
        {mvp && mvp.kills > 0 && (
          <div style={{
            background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-lg)', padding: '16px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <Icon name="zap" size={28} color="var(--kn-accent)" />
            <div>
              <div data-label="" style={{ fontSize: 10, marginBottom: 2 }}>MVP</div>
              <div style={{ fontSize: 18, fontWeight: 'var(--kn-w-bold)' }}>{mvp.nick}
                <span style={{ fontSize: 12, color: 'var(--kn-text-muted)', fontWeight: 400, marginLeft: 8 }}>{mvp.teamName}</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
              {[
                { label: '킬', val: mvp.kills, color: 'var(--kn-text)' },
                { label: '보너스', val: `+${mvp.bonus}`, color: 'var(--kn-success)' },
                { label: '총점', val: mvp.total, color: 'var(--kn-accent)' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', marginBottom: 2 }}>{s.label}</div>
                  <div data-display="" style={{ fontSize: 20, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* 왼쪽: 팀 순위 + 개인 통계 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 최종 팀 순위 */}
            <section>
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>최종 팀 순위</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {teamScores.map((t, idx) => (
                  <div key={t.id} style={{
                    background: 'var(--kn-surface-1)',
                    border: `1px solid ${idx === 0 ? 'color-mix(in oklab, var(--kn-accent) 40%, transparent)' : 'var(--kn-border)'}`,
                    borderRadius: 'var(--kn-r-lg)', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <RankBadge rank={idx + 1} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', marginBottom: 3 }}>{t.name}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--kn-text-muted)', flexWrap: 'wrap' }}>
                        <span>킬 <b style={{ color: 'var(--kn-text)' }}>{t.kills}</b></span>
                        <span>보너스 <b style={{ color: 'var(--kn-success)' }}>+{t.bonus}</b></span>
                        <span>패널티 <b style={{ color: 'var(--kn-danger)' }}>-{t.penalty}</b></span>
                        {t.adj !== 0 && (
                          <span>수동조정 <b style={{ color: t.adj > 0 ? 'var(--kn-success)' : 'var(--kn-danger)' }}>{t.adj > 0 ? '+' : ''}{t.adj}</b></span>
                        )}
                      </div>
                    </div>
                    <div data-display="" style={{
                      fontSize: idx === 0 ? 40 : 32,
                      color: idx === 0 ? 'var(--kn-accent)' : 'var(--kn-text)',
                      fontFamily: 'var(--kn-font-mono)',
                      minWidth: 60, textAlign: 'right',
                    }}>
                      {t.total}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 개인별 최종 통계 */}
            <section>
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>개인 최종 통계</span>
              <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', overflow: 'hidden' }}>
                {teamScores.map((team, tIdx) => {
                  const stats = (team.members || [])
                    .map((m) => ({
                      nick:    m.playerNickname,
                      kills:   m.totalKills,
                      bonus:   m.bonusKills,
                      penalty: m.penaltyKills,
                      total:   m.effectiveKills,
                      damage:  getPlayerDamage(m.playerNickname, matches),
                    }))
                    .sort((a, b) => b.kills - a.kills);
                  return (
                    <div key={team.id}>
                      <div style={{
                        background: 'var(--kn-surface-2)', borderLeft: '3px solid var(--kn-accent)',
                        padding: '8px 14px', fontSize: 12, fontWeight: 'var(--kn-w-bold)',
                        borderTop: tIdx > 0 ? '1px solid var(--kn-border)' : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span>{team.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--kn-text-muted)', fontWeight: 400 }}>{team.members.length}명</span>
                      </div>
                      {stats.length === 0 ? (
                        <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--kn-text-dim)' }}>플레이어 없음</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--kn-border)' }}>
                              {['닉네임', '킬', '데미지', '보너스', '패널티', '총점'].map((h) => (
                                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: 'var(--kn-text-muted)', fontWeight: 500 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.map((p, pIdx) => (
                              <tr key={p.nick} style={{ borderBottom: '1px solid var(--kn-border)', background: pIdx === 0 && p.kills > 0 ? 'color-mix(in oklab, var(--kn-accent) 3%, transparent)' : 'transparent' }}>
                                <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: pIdx === 0 ? 700 : 400 }}>
                                  {pIdx === 0 && p.kills > 0 && <Icon name="zap" size={12} color="var(--kn-accent)" style={{ marginRight: 4 }} />}
                                  {p.nick}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>{p.kills}</td>
                                <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--kn-text-muted)' }}>{p.damage}</td>
                                <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--kn-success)' }}>{p.bonus > 0 ? `+${p.bonus}` : '0'}</td>
                                <td style={{ padding: '8px 12px', fontSize: 13, color: p.penalty > 0 ? 'var(--kn-danger)' : 'var(--kn-text-dim)' }}>{p.penalty > 0 ? `-${p.penalty}` : '0'}</td>
                                <td style={{ padding: '8px 12px', fontSize: 16, fontWeight: 900, color: 'var(--kn-accent)' }}>{p.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* 오른쪽: 매치 히스토리 + 룰 요약 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 매치 히스토리 */}
            <section>
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>매치 히스토리</span>
              <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '12px 14px', maxHeight: 320, overflowY: 'auto' }}>
                {matches.length === 0 ? (
                  <div style={{ color: 'var(--kn-text-dim)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>매치 기록 없음</div>
                ) : (
                  [...matches].reverse().map((m) => {
                    const results = m.memberResults || [];
                    const hasChicken = results.some((r) => r.isChicken);
                    const chickenTeam = hasChicken
                      ? teamScores.find((t) => results.find((r) => r.isChicken && r.teamId === t.id))
                      : null;
                    const teamKills = teamScores.map((t) => ({
                      name:  t.name,
                      kills: results.filter((r) => r.teamId === t.id).reduce((s, r) => s + r.kills, 0),
                    }));
                    return (
                      <div key={m.matchId} style={{ padding: '10px 0', borderBottom: '1px solid var(--kn-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kn-accent)' }}>매치 #{m.matchNumber}</span>
                          <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>{m.playedAt ? new Date(m.playedAt).toLocaleTimeString('ko') : ''}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {teamKills.map((tk) => (
                            <div key={tk.name} style={{
                              background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)',
                              borderRadius: 'var(--kn-r-sm)', padding: '3px 8px', fontSize: 11,
                            }}>
                              <span style={{ color: 'var(--kn-text-muted)' }}>{tk.name} </span>
                              <span style={{ fontWeight: 700 }}>{tk.kills}킬</span>
                            </div>
                          ))}
                        </div>
                        {chickenTeam && (
                          <div style={{ fontSize: 11, color: 'var(--kn-accent)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="trophy" size={12} /> {chickenTeam.name} 치킨!
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* 룰 요약 */}
            <section>
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>적용 룰</span>
              <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 8 }}>
                  목표 {rule.targetKills}킬 ·&nbsp;
                  {rule.noTimeLimit ? '시간 제한 없음' : `${rule.timeLimitMin}분`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { label: '헤드샷', icon: 'target', on: rule.headShotBonusOn, val: `+${rule.headShotBonus}` },
                    { label: '어시스트', icon: 'users', on: rule.assistBonusOn, val: `+${rule.assistBonus}` },
                    { label: '치킨', icon: 'trophy', on: rule.chickenBonusOn, val: `+${rule.chickenBonus}` },
                    { label: '팀킬', icon: 'alert', on: rule.teamKillPenaltyOn, val: `-${rule.teamKillPenalty}` },
                    { label: '사망', icon: 'flame', on: rule.deathPenaltyOn, val: `-${rule.deathPenalty}` },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, opacity: item.on ? 1 : 0.35 }}>
                      <span style={{ color: 'var(--kn-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name={item.icon} size={13} /> {item.label}
                      </span>
                      <span style={{ fontWeight: 700, color: item.val.startsWith('+') ? 'var(--kn-success)' : 'var(--kn-danger)' }}>
                        {item.on ? item.val : '비활성'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <Button variant="primary" size="lg" onClick={() => router.push('/dashboard')} icon="back" style={{ minWidth: 200 }}>
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
