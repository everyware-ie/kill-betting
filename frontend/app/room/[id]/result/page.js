/**
 * ============================================================
 *  최종 결과 페이지  /room/:id/result
 * ============================================================
 *
 *  [화면 구성]
 *   - 우승 팀 선언 배너 (1위 팀 이름 + 점수 크게 표시)
 *   - 최종 팀 순위 카드 (킬/보너스/패널티/조정 상세 포함)
 *   - MVP 플레이어 (전체 중 킬 수 1위)
 *   - 개인별 최종 통계 테이블
 *   - 매치 히스토리 요약
 *   - [대시보드로] 버튼
 *
 *  [API 호출]
 *   RoomAPI.get(roomId)        — 방/팀/룰 정보
 *   RoomAPI.getMatches(roomId) — 전체 매치 데이터
 *
 * ============================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth }  from '@/lib/auth-context';
import { RoomAPI }  from '@/lib/room-api';
import Button       from '@/components/ui/Button';

// ─────────────────────────────────────────
//  점수 계산 유틸 (live 페이지와 동일 로직)
// ─────────────────────────────────────────

/** 팀 총점 계산 */
function calcTeamScore(teamId, matches, rule, adjustments = []) {
  let kills = 0, bonus = 0, penalty = 0;
  for (const m of matches) {
    if (rule.chickenBonusOn && m.chickenTeamId === teamId) bonus += rule.chickenBonus;
    for (const r of (m.results || [])) {
      if (r.teamId !== teamId) continue;
      kills += r.kills;
      if (rule.headShotBonusOn  && r.headShot)   bonus   += rule.headShotBonus;
      if (rule.assistBonusOn    && r.assist)      bonus   += rule.assistBonus;
      if (rule.teamKillPenaltyOn)                 penalty += (r.teamKills || 0) * rule.teamKillPenalty;
      if (rule.deathPenaltyOn   && r.earlyDeath)  penalty += rule.deathPenalty;
    }
  }
  const adj = adjustments
    .filter((a) => a.teamId === teamId)
    .reduce((s, a) => s + a.amount, 0);
  return { kills, bonus, penalty, adj, total: kills + bonus - penalty + adj };
}

/** 개인 통계 계산 */
function calcPlayerStats(nick, matches, rule) {
  let kills = 0, bonus = 0, penalty = 0, damage = 0, chickens = 0;
  for (const m of matches) {
    for (const r of (m.results || [])) {
      if (r.nick !== nick) continue;
      kills  += r.kills;
      damage += r.damage || 0;
      if (rule.headShotBonusOn  && r.headShot)   bonus   += rule.headShotBonus;
      if (rule.assistBonusOn    && r.assist)      bonus   += rule.assistBonus;
      if (rule.teamKillPenaltyOn)                 penalty += (r.teamKills || 0) * rule.teamKillPenalty;
      if (rule.deathPenaltyOn   && r.earlyDeath)  penalty += rule.deathPenalty;
    }
    // 이 플레이어가 속한 팀이 치킨을 먹었는지 확인 (r.teamId 기준으로 정확히 판별)
    const playerResult = (m.results || []).find((r) => r.nick === nick);
    if (playerResult && m.chickenTeamId === playerResult.teamId) chickens++;
  }
  return { kills, bonus, penalty, damage, chickens, total: kills + bonus - penalty };
}

// ─────────────────────────────────────────
//  순위 배지 컴포넌트
// ─────────────────────────────────────────

/** 1위/2위/3위 뱃지 */
function RankBadge({ rank }) {
  // 순위별 색상과 아이콘
  const styles = {
    1: { bg: 'rgba(245,166,35,0.15)', border: 'rgba(245,166,35,0.6)', color: '#F5A623', icon: '🥇' },
    2: { bg: 'rgba(180,180,180,0.1)', border: 'rgba(180,180,180,0.4)', color: '#C0C0C0', icon: '🥈' },
    3: { bg: 'rgba(180,100,40,0.1)',  border: 'rgba(180,100,40,0.4)',  color: '#CD7F32', icon: '🥉' },
  };
  const s = styles[rank] || { bg: 'transparent', border: 'rgba(200,155,0,0.15)', color: '#8A8060', icon: `#${rank}` };
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: s.bg, border: `1px solid ${s.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: rank <= 3 ? 20 : 13, fontWeight: 700, color: s.color,
      flexShrink: 0,
    }}>
      {s.icon}
    </div>
  );
}

// ─────────────────────────────────────────
//  메인 페이지
// ─────────────────────────────────────────

export default function ResultPage() {
  const router  = useRouter();
  const { id: roomId } = useParams();
  const { user } = useAuth();

  const [room,    setRoom]    = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // ── 데이터 로드 ──
  // TODO: API 연결 필요 — RoomAPI.get()과 RoomAPI.getMatches()가 실제 백엔드를 바라보도록
  //       lib/api.js 의 USE_MOCK = false 로 변경 후 API_BASE_URL 설정
  useEffect(() => {
    if (!user) return;
    Promise.all([RoomAPI.get(roomId), RoomAPI.getMatches(roomId)]).then(([roomRes, matchRes]) => {
      if (!roomRes.ok) { setError(roomRes.error); setLoading(false); return; }
      setRoom(roomRes.room);
      if (matchRes.ok) setMatches(matchRes.matches);
      setLoading(false);
    });
  }, [roomId, user]);

  // ── 로그인 체크 ──
  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  // ── 로딩/에러 화면 ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8060' }}>
      결과를 불러오는 중...
    </div>
  );
  if (error || !room) return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ color: '#E53935', fontSize: 15 }}>{error || '방을 찾을 수 없습니다'}</div>
      <Button variant="secondary" onClick={() => router.push('/dashboard')}>대시보드로</Button>
    </div>
  );

  const { rule, teams } = room;
  const adjs = room.adjustments || [];

  // ── 팀 최종 점수 계산 및 순위 정렬 ──
  const teamScores = [...teams]
    .map((t) => ({ ...t, ...calcTeamScore(t.id, matches, rule, adjs) }))
    .sort((a, b) => b.total - a.total);

  const winner = teamScores[0]; // 1위 팀

  // ── 전체 플레이어 통계 (킬 수 기준 MVP 선정) ──
  const allPlayerStats = teams.flatMap((t) =>
    t.players.map((nick) => ({
      nick,
      teamName: t.name,
      ...calcPlayerStats(nick, matches, rule),
    }))
  ).sort((a, b) => b.kills - a.kills);

  const mvp = allPlayerStats[0]; // 킬 수 1위 플레이어

  return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <div style={{
        background: '#1C1A0C', borderBottom: '1px solid rgba(200,155,0,0.18)',
        padding: '0 24px', height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, fontStyle: 'italic', color: '#F5A623', letterSpacing: 2 }}>
          KILL CHALLENGE
        </div>
        <div style={{ fontSize: 12, color: '#8A8060' }}>{room.title}</div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ flex: 1, padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>

        {/* 우승 팀 선언 배너 */}
        {winner && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(28,26,12,0) 60%)',
            border: '1px solid rgba(245,166,35,0.4)',
            borderRadius: 12, padding: '28px 32px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 52 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 3, marginBottom: 4 }}>FINAL WINNER</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 42, fontWeight: 900, fontStyle: 'italic',
                color: '#F5A623', lineHeight: 1, marginBottom: 6,
              }}>
                {winner.name}
              </div>
              <div style={{ fontSize: 13, color: '#8A8060' }}>
                총 {matches.length}판 진행 &nbsp;·&nbsp; 킬 {winner.kills} &nbsp;+{winner.bonus} &nbsp;-{winner.penalty}
                {winner.adj !== 0 && <> &nbsp;·&nbsp; 조정 {winner.adj > 0 ? '+' : ''}{winner.adj}</>}
              </div>
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 80, fontWeight: 900, color: '#F5A623', lineHeight: 1,
            }}>
              {winner.total}
            </div>
          </div>
        )}

        {/* MVP 배너 */}
        {mvp && mvp.kills > 0 && (
          <div style={{
            background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.2)',
            borderRadius: 10, padding: '16px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 30 }}>⭐</div>
            <div>
              <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 2, marginBottom: 2 }}>MVP</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{mvp.nick}
                <span style={{ fontSize: 12, color: '#8A8060', fontWeight: 400, marginLeft: 8 }}>{mvp.teamName}</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
              {[
                { label: '킬', val: mvp.kills, color: '#E8DFC0' },
                { label: '보너스', val: `+${mvp.bonus}`, color: '#F5A623' },
                { label: '총점', val: mvp.total, color: '#F5A623' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#8A8060', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
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
              <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>최종 팀 순위</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {teamScores.map((t, idx) => (
                  <div key={t.id} style={{
                    background: '#1C1A0C',
                    border: `1px solid ${idx === 0 ? 'rgba(245,166,35,0.4)' : 'rgba(200,155,0,0.15)'}`,
                    borderRadius: 8, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <RankBadge rank={idx + 1} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{t.name}</div>
                      {/* 점수 세부 내역 */}
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#8A8060', flexWrap: 'wrap' }}>
                        <span>킬 <b style={{ color: '#E8DFC0' }}>{t.kills}</b></span>
                        <span>보너스 <b style={{ color: '#F5A623' }}>+{t.bonus}</b></span>
                        <span>패널티 <b style={{ color: '#E53935' }}>-{t.penalty}</b></span>
                        {t.adj !== 0 && (
                          <span>수동조정 <b style={{ color: t.adj > 0 ? '#F5A623' : '#E53935' }}>{t.adj > 0 ? '+' : ''}{t.adj}</b></span>
                        )}
                      </div>
                    </div>
                    {/* 최종 점수 */}
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: idx === 0 ? 44 : 36,
                      fontWeight: 900,
                      color: idx === 0 ? '#F5A623' : '#E8DFC0',
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
              <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>개인 최종 통계</div>
              <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, overflow: 'hidden' }}>
                {teams.map((team, tIdx) => {
                  const stats = team.players
                    .map((nick) => ({ nick, ...calcPlayerStats(nick, matches, rule) }))
                    .sort((a, b) => b.kills - a.kills);
                  return (
                    <div key={team.id}>
                      {/* 팀 헤더 */}
                      <div style={{
                        background: 'rgba(200,155,0,0.06)', borderLeft: '3px solid #F5A623',
                        padding: '8px 14px', fontSize: 12, fontWeight: 700,
                        borderTop: tIdx > 0 ? '1px solid rgba(200,155,0,0.1)' : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span>{team.name}</span>
                        <span style={{ fontSize: 11, color: '#8A8060', fontWeight: 400 }}>{team.players.length}명</span>
                      </div>
                      {stats.length === 0 ? (
                        <div style={{ padding: '12px 14px', fontSize: 12, color: '#555' }}>플레이어 없음</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(200,155,0,0.08)' }}>
                              {['닉네임', '킬', '데미지', '보너스', '패널티', '총점'].map((h) => (
                                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: '#8A8060', fontWeight: 500 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.map((p, pIdx) => (
                              <tr key={p.nick} style={{ borderBottom: '1px solid rgba(200,155,0,0.05)', background: pIdx === 0 && p.kills > 0 ? 'rgba(245,166,35,0.03)' : 'transparent' }}>
                                <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: pIdx === 0 ? 700 : 400 }}>
                                  {pIdx === 0 && p.kills > 0 && <span style={{ color: '#F5A623', marginRight: 4 }}>★</span>}
                                  {p.nick}
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>{p.kills}</td>
                                <td style={{ padding: '8px 12px', fontSize: 12, color: '#8A8060' }}>{p.damage}</td>
                                <td style={{ padding: '8px 12px', fontSize: 13, color: '#F5A623' }}>{p.bonus > 0 ? `+${p.bonus}` : '0'}</td>
                                <td style={{ padding: '8px 12px', fontSize: 13, color: p.penalty > 0 ? '#E53935' : '#555' }}>{p.penalty > 0 ? `-${p.penalty}` : '0'}</td>
                                <td style={{ padding: '8px 12px', fontSize: 16, fontWeight: 900, color: '#F5A623' }}>{p.total}</td>
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
              <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>매치 히스토리</div>
              <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, padding: '12px 14px', maxHeight: 320, overflowY: 'auto' }}>
                {matches.length === 0 ? (
                  <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>매치 기록 없음</div>
                ) : (
                  [...matches].reverse().map((m) => {
                    const chickenTeam = teams.find((t) => t.id === m.chickenTeamId);
                    // 팀별 킬 합산
                    const teamKills = teams.map((t) => ({
                      name: t.name,
                      kills: m.results.filter((r) => r.teamId === t.id).reduce((s, r) => s + r.kills, 0),
                    }));
                    return (
                      <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(200,155,0,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#F5A623' }}>매치 #{m.number}</span>
                          <span style={{ fontSize: 10, color: '#555' }}>{new Date(m.createdAt).toLocaleTimeString('ko')}</span>
                        </div>
                        {/* 팀별 이번 매치 킬 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {teamKills.map((tk) => (
                            <div key={tk.name} style={{
                              background: '#141200', border: '1px solid rgba(200,155,0,0.12)',
                              borderRadius: 4, padding: '3px 8px', fontSize: 11,
                            }}>
                              <span style={{ color: '#8A8060' }}>{tk.name} </span>
                              <span style={{ fontWeight: 700 }}>{tk.kills}킬</span>
                            </div>
                          ))}
                        </div>
                        {chickenTeam && (
                          <div style={{ fontSize: 11, color: '#F5A623', marginTop: 4 }}>
                            🍗 {chickenTeam.name} 치킨!
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
              <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>적용 룰</div>
              <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, padding: '14px 16px' }}>
                {/* 기본 설정 */}
                <div style={{ fontSize: 12, color: '#8A8060', marginBottom: 8 }}>
                  {rule.gameMode} · 목표 {rule.targetKills}킬 ·&nbsp;
                  {rule.noTimeLimit ? '시간 제한 없음' : `${rule.timeLimitMin}분`}
                </div>
                {/* 보너스/패널티 항목 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { label: '🎯 헤드샷',  on: rule.headShotBonusOn,   val: `+${rule.headShotBonus}` },
                    { label: '🤝 어시스트', on: rule.assistBonusOn,     val: `+${rule.assistBonus}` },
                    { label: '🍗 치킨',    on: rule.chickenBonusOn,    val: `+${rule.chickenBonus}` },
                    { label: '💀 팀킬',    on: rule.teamKillPenaltyOn, val: `-${rule.teamKillPenalty}` },
                    { label: '☠️ 사망',    on: rule.deathPenaltyOn,    val: `-${rule.deathPenalty}` },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: item.on ? 1 : 0.35 }}>
                      <span style={{ color: '#8A8060' }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.val.startsWith('+') ? '#F5A623' : '#E53935' }}>
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
          <Button size="lg" onClick={() => router.push('/dashboard')} style={{ minWidth: 200 }}>
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
