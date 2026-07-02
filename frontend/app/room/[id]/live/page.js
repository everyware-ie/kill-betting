'use client';

import { useTheme } from '@/lib/theme-context';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import RoleGuideModal from '@/components/ui/RoleGuideModal';
import useLivePage from '@/features/live/hooks/useLivePage';
import TeamResultModal from '@/features/live/components/TeamResultModal';
import AdminModal from '@/features/live/components/AdminModal';
import ScreenshotModal from '@/features/live/components/ScreenshotModal';
import { calcPlayerStats } from '@/features/live/utils/scoreCalc';
import { fmtTime, fmtMMSS } from '@/features/live/utils/scoreCalc';

export default function LivePage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const {
    room, matches, adjs, elapsed, loading, sessionId, connected,
    isHost, myTeam, teamScores, timeLeft, gameOver, targetReachedTeam,
    showTeamModal, selectedTeamId, modalMatchNum,
    showAdminModal, showRoleGuide, matchError, screenshotModal,
    setShowTeamModal, setShowAdminModal, setShowRoleGuide, setScreenshotModal,
    openTeamModal, handleMatchConfirmed, handleAdjust, handleRuleUpdate, handleEnd,
  } = useLivePage();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-text-muted)' }}>
      <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite' }} />
    </div>
  );

  if (!room) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-danger)' }}>
      <Icon name="alert" size={16} style={{ marginRight: 8 }} /> 방을 찾을 수 없습니다
    </div>
  );

  const { rule, teams } = room;
  const maxScore = Math.max(1, ...teamScores.map((t) => t.total));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', display: 'flex', flexDirection: 'column' }}>

      {/* 연결 불안정 배너 */}
      {!connected && sessionId && (
        <div style={{ background: 'color-mix(in oklab, var(--kn-danger) 8%, var(--kn-bg))', borderBottom: '1px solid color-mix(in oklab, var(--kn-danger) 30%, transparent)', padding: '8px 22px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--kn-danger)', flexShrink: 0 }}>
          <Icon name="alert" size={14} />
          서버와의 연결이 불안정합니다. 점수가 실시간으로 반영되지 않을 수 있습니다.
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: 'var(--kn-surface-1)', borderBottom: '1px solid var(--kn-border)', padding: '0 22px', height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--kn-accent-bg)', border: '1px solid color-mix(in oklab, var(--kn-accent) 20%, transparent)', borderRadius: 'var(--kn-r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="target" size={18} color="var(--kn-accent)" />
          </div>
          <div>
            <div data-label="" style={{ fontSize: 10 }}>LIVE SCOREBOARD</div>
            <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--kn-success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--kn-success)', animation: 'kn-pulse 1.4s infinite' }} /> LIVE
              </span>
              <span>{room.title}</span>
              <span>|</span>
              <span>매치 {matches.length}판</span>
              {isHost && <span style={{ color: 'var(--kn-accent)', fontWeight: 700 }}>| 방장</span>}
              {myTeam && <span style={{ color: 'var(--kn-accent)', fontWeight: 700 }}>| {myTeam.name} LEADER</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={toggleTheme} title="테마 전환" style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text-muted)', width: 30, height: 30, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </button>
          <button onClick={() => setShowRoleGuide(true)} title="역할 안내" style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text-muted)', width: 30, height: 30, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="info" size={16} />
          </button>
          <div style={{ background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-md)', padding: '7px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--kn-text-muted)', letterSpacing: 1.5, marginBottom: 2 }}>경과 시간</div>
            <div data-mono="" style={{ fontSize: 18, fontWeight: 700 }}>{fmtTime(elapsed)}</div>
          </div>
          {timeLeft !== null && (
            <div style={{ background: 'color-mix(in oklab, var(--kn-danger) 5%, var(--kn-surface-2))', border: '1px solid color-mix(in oklab, var(--kn-danger) 25%, transparent)', borderRadius: 'var(--kn-r-md)', padding: '7px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--kn-text-muted)', letterSpacing: 1.5, marginBottom: 2 }}>남은 시간</div>
              <div data-mono="" style={{ fontSize: 18, fontWeight: 700, color: timeLeft < 300 ? 'var(--kn-danger)' : 'var(--kn-text)' }}>{fmtMMSS(timeLeft)}</div>
            </div>
          )}
        </div>
      </div>

      {/* 경기 종료 조건 배너 */}
      {gameOver && (
        <div style={{ background: targetReachedTeam ? 'color-mix(in oklab, var(--kn-accent) 10%, transparent)' : 'color-mix(in oklab, var(--kn-danger) 8%, transparent)', borderBottom: `1px solid ${targetReachedTeam ? 'color-mix(in oklab, var(--kn-accent) 35%, transparent)' : 'color-mix(in oklab, var(--kn-danger) 30%, transparent)'}`, padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name={targetReachedTeam ? 'trophy' : 'clock'} size={22} color={targetReachedTeam ? 'var(--kn-accent)' : 'var(--kn-danger)'} />
            <div>
              {targetReachedTeam ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: 'var(--kn-accent)' }}>{targetReachedTeam.name} — 목표 킬 {rule.targetKills}킬 달성!</div>
                  <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>경기를 종료하고 최종 결과를 확정하세요</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: 'var(--kn-danger)' }}>제한 시간 종료!</div>
                  <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>경기를 종료해주세요</div>
                </>
              )}
            </div>
          </div>
          {isHost && <Button variant="danger" onClick={handleEnd} icon="flag">경기 종료</Button>}
        </div>
      )}

      {/* 본문 */}
      <div style={{ flex: 1, padding: '16px 22px', overflowY: 'auto' }}>

        {/* 팀별 점수 카드 */}
        <section style={{ marginBottom: 20 }}>
          <span data-label="" style={{ marginBottom: 10, display: 'block' }}>팀 현황</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(teamScores.length, 4)}, 1fr)`, gap: 12 }}>
            {(() => {
              const maxTotal = Math.max(...teamScores.map((t) => t.total));
              return teamScores.map((t) => {
                const isFirst = t.total === maxTotal && maxTotal > 0;
                const rank = teamScores.filter((o) => o.total > t.total).length + 1;
                const safeTarget = rule.targetKills > 0 ? rule.targetKills : 1;
                const progress = Math.min(100, Math.round((t.total / safeTarget) * 100));
                const isTargetDone = t.total >= rule.targetKills;
                return (
                  <div key={t.id} style={{ background: 'var(--kn-surface-1)', border: `1px solid ${isTargetDone ? 'color-mix(in oklab, var(--kn-accent) 60%, transparent)' : isFirst ? 'color-mix(in oklab, var(--kn-accent) 40%, transparent)' : 'var(--kn-border)'}`, borderRadius: 'var(--kn-r-lg)', padding: '14px 16px', boxShadow: isTargetDone ? '0 0 16px color-mix(in oklab, var(--kn-accent) 15%, transparent)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 10, color: isTargetDone ? 'var(--kn-accent)' : 'var(--kn-text-muted)', letterSpacing: 1.5, fontWeight: isTargetDone ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isTargetDone ? <><Icon name="trophy" size={12} /> WINNER</> : `RANK #${rank}`}
                      </div>
                      <div data-display="" style={{ fontSize: 36, color: isFirst ? 'var(--kn-accent)' : 'var(--kn-text)', fontFamily: 'var(--kn-font-mono)' }}>{t.total}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-bold)', marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', marginBottom: 8 }}>
                      목표: {rule.targetKills}킬 &nbsp;
                      <span style={{ color: isTargetDone ? 'var(--kn-success)' : 'var(--kn-text-muted)', fontWeight: isTargetDone ? 700 : 400 }}>
                        {t.kills}/{rule.targetKills}킬 {isTargetDone ? '달성' : `(${Math.round(progress)}%)`}
                      </span>
                    </div>
                    <div style={{ background: 'var(--kn-surface-3)', borderRadius: 2, height: 5, marginBottom: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: isTargetDone ? 'var(--kn-success)' : isFirst ? 'var(--kn-accent)' : 'var(--kn-text-muted)', width: `${progress}%`, transition: 'width .4s' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 11, gap: 2 }}>
                      {[
                        { label: '킬', val: t.kills, color: 'var(--kn-text)' },
                        { label: '보너스', val: `+${t.bonus}`, color: 'var(--kn-success)' },
                        { label: '패널티', val: `-${t.penalty}`, color: 'var(--kn-danger)' },
                      ].map((s) => (
                        <div key={s.label}>
                          <div style={{ color: 'var(--kn-text-muted)' }}>{s.label}</div>
                          <div style={{ fontWeight: 700, color: s.color }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                    {t.adj !== 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: t.adj > 0 ? 'var(--kn-success)' : 'var(--kn-danger)' }}>
                        조정: {t.adj > 0 ? '+' : ''}{t.adj}
                      </div>
                    )}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--kn-border)' }}>
                      {(() => {
                        const teamMatchCount = matches.filter((m) => (m.memberResults || []).some((r) => r.teamId === t.id)).length;
                        return (
                          <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', textAlign: 'center', marginBottom: myTeam?.id === t.id ? 6 : 0 }}>
                            {teamMatchCount > 0 ? `${teamMatchCount}게임 완료` : '아직 결과 없음'}
                          </div>
                        );
                      })()}
                      {myTeam?.id === t.id && (
                        <Button variant="accent" fullWidth onClick={() => openTeamModal(t.id)} icon="edit" style={{ fontSize: 12 }}>
                          결과 입력
                        </Button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

          {/* 개인별 통계 */}
          <section>
            <span data-label="" style={{ marginBottom: 10, display: 'block' }}>개인 통계</span>
            <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', overflow: 'hidden' }}>
              {teams.map((team, tIdx) => {
                const stats = (team.players || [])
                  .map((p) => { const nick = typeof p === 'string' ? p : p.nickname; return { nick, ...calcPlayerStats(nick, matches, rule) }; })
                  .sort((a, b) => b.kills - a.kills);
                return (
                  <div key={team.id}>
                    <div style={{ background: 'var(--kn-surface-2)', borderLeft: '3px solid var(--kn-accent)', padding: '8px 14px', fontSize: 12, fontWeight: 'var(--kn-w-bold)', borderTop: tIdx > 0 ? '1px solid var(--kn-border)' : 'none' }}>
                      {team.name}
                    </div>
                    {stats.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--kn-text-dim)' }}>플레이어 없음</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--kn-border)' }}>
                            {['닉네임', '킬', '보너스', '패널티', '총점'].map((h) => (
                              <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: 'var(--kn-text-muted)', fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map((p) => (
                            <tr key={p.nick} style={{ borderBottom: '1px solid var(--kn-border)' }}>
                              <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.nick}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.kills}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--kn-success)' }}>{p.bonus > 0 ? `+${p.bonus}` : '0'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13, color: p.penalty > 0 ? 'var(--kn-danger)' : 'var(--kn-text-dim)' }}>{p.penalty > 0 ? `-${p.penalty}` : '0'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 17, fontWeight: 700, color: 'var(--kn-accent)' }}>{p.total}</td>
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

          {/* 매치 히스토리 */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span data-label="">매치 히스토리</span>
              {matches.length > 30 && <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>{matches.length}게임 중 최근 30개</span>}
            </div>
            <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '12px 14px', maxHeight: 340, overflowY: 'auto' }}>
              {matches.length === 0 ? (
                <div style={{ color: 'var(--kn-text-dim)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>아직 결과 없음</div>
              ) : (
                [...matches].reverse().slice(0, 30).map((m) => {
                  const results = m.memberResults || [];
                  const totalKills = results.reduce((s, r) => s + r.kills, 0);
                  const hasChicken = results.some((r) => r.isChicken);
                  const hasShot = !!m.screenshotUrl;
                  return (
                    <div key={m.matchId} onClick={() => hasShot && setScreenshotModal({ url: m.screenshotUrl, match: m })} style={{ padding: '9px 0', borderBottom: '1px solid var(--kn-border)', cursor: hasShot ? 'pointer' : 'default', borderRadius: 'var(--kn-r-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--kn-accent)' }}>매치 #{m.matchNumber}</span>
                          {hasChicken && <Icon name="trophy" size={10} color="var(--kn-accent)" />}
                          {hasShot && <Icon name="image" size={10} color="var(--kn-text-muted)" />}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>{m.playedAt ? new Date(m.playedAt).toLocaleTimeString('ko') : ''}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>
                        킬: <b style={{ color: 'var(--kn-text)' }}>{totalKills}</b>
                        {results.map((r) => (
                          <span key={r.playerId} style={{ marginLeft: 6 }}>{r.playerNickname} {r.kills}킬</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {adjs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span data-label="" style={{ marginBottom: 8, display: 'block' }}>점수 조정 내역</span>
                <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '10px 14px' }}>
                  {adjs.map((a, i) => {
                    const team = teams.find((t) => t.id === a.teamId);
                    return (
                      <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--kn-border)', fontSize: 11 }}>
                        <span style={{ color: 'var(--kn-text-muted)' }}>{team?.name}</span>
                        <span style={{ marginLeft: 8, color: a.amount > 0 ? 'var(--kn-success)' : 'var(--kn-danger)', fontWeight: 700 }}>
                          {a.amount > 0 ? '+' : ''}{a.amount}
                        </span>
                        <div style={{ color: 'var(--kn-text-dim)', marginTop: 2 }}>{a.reason}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 하단 바 */}
      <div style={{ background: 'var(--kn-surface-1)', borderTop: '1px solid var(--kn-border)', padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12 }}>
          {gameOver ? (
            <span style={{ color: targetReachedTeam ? 'var(--kn-accent)' : 'var(--kn-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={targetReachedTeam ? 'trophy' : 'clock'} size={14} />
              {targetReachedTeam ? `${targetReachedTeam.name} 목표 킬 달성` : '시간 종료'} — 경기를 종료해주세요
            </span>
          ) : (
            <span style={{ color: 'var(--kn-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isHost && <span style={{ color: 'var(--kn-accent)', fontWeight: 700 }}>방장</span>}
              {myTeam ? `${myTeam.name} LEADER` : '관전자'} —&nbsp;
              {myTeam ? '게임이 끝날 때마다 내 팀 카드의 [결과 입력]으로 결과를 제출하세요' : '각 팀 LEADER가 게임 결과를 입력합니다'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {matchError && (
            <span style={{ fontSize: 11, color: 'var(--kn-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="alert" size={13} /> {matchError}
            </span>
          )}
          {isHost && <Button variant="ghost" onClick={() => setShowAdminModal(true)} icon="settings">운영 메뉴</Button>}
        </div>
      </div>

      {/* 모달 */}
      {showTeamModal && selectedTeamId && (
        <TeamResultModal room={room} teamId={selectedTeamId} matchNumber={modalMatchNum} sessionId={sessionId} onConfirmed={handleMatchConfirmed} onClose={() => setShowTeamModal(false)} />
      )}
      {showAdminModal && (
        <AdminModal room={room} onAdjust={handleAdjust} onEnd={handleEnd} onRuleUpdate={handleRuleUpdate} onClose={() => setShowAdminModal(false)} />
      )}
      {screenshotModal && (
        <ScreenshotModal info={screenshotModal} onClose={() => setScreenshotModal(null)} />
      )}
      {showRoleGuide && (
        <RoleGuideModal onClose={() => setShowRoleGuide(false)} />
      )}
    </div>
  );
}
