/**
 * ============================================================
 *  최종 결과 페이지  /room/:id/result
 * ============================================================
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth }  from '@/lib/auth-context';
import { RoomAPI }  from '@/lib/room-api';
import { useWebSocket } from '@/lib/useWebSocket';
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
//  후원 배너
// ─────────────────────────────────────────

const ACCOUNT_NUMBER = '79794767093';
const ACCOUNT_BANK   = '카카오뱅크';
const ACCOUNT_HOLDER = '박지응';

function DonationBanner({ isWinner, onDismiss }) {
  const [copied,     setCopied]     = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [selected,   setSelected]   = useState(2); // 기본: 5,000원

  const amounts = [
    { label: '1,000원', sub: '아메리카노 1/5' },
    { label: '3,000원', sub: '반 잔 정도' },
    { label: '5,000원', sub: '커피 한 잔 ☕' },
    { label: '10,000원', sub: '라떼도 돼요' },
  ];

  const headline = isWinner
    ? '🎉 축하해요! 오늘 킬내기 승리를 커피 한 잔으로 더 달콤하게!'
    : '오늘은 졌지만 분풀이 대신 커피 한 잔 어떨까요? ☕';
  const desc = isWinner
    ? '멋진 승리였어요! 기쁜 날, 친구들이 만든 서비스에 커피 한 잔 후원해주시면 정말 큰 힘이 돼요 🏆'
    : '지는 날도 있죠. 친구들이 만든 작은 사이드 프로젝트예요. 위로의 커피 한 잔 부탁드려요 💛';

  function handleCopy() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  if (showThanks) return (
    <div style={{
      background: 'var(--kn-surface-1)',
      border: '1px solid color-mix(in oklab, var(--kn-accent) 50%, transparent)',
      borderRadius: 'var(--kn-r-xl)',
      padding: '24px 28px',
      marginBottom: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      textAlign: 'center',
    }}>
      <Icon name="coffee" size={36} color="var(--kn-accent)" />
      <div style={{ fontSize: 17, fontWeight: 700 }}>감사합니다!</div>
      <div style={{ fontSize: 13, color: 'var(--kn-text-muted)', lineHeight: 1.6 }}>
        소중한 커피 한 잔 덕분에<br />오늘도 개발을 이어갈 수 있어요.<br /><strong>다음 매치도 즐기러 오세요!</strong>
      </div>
      <button
        onClick={onDismiss}
        style={{
          marginTop: 4, background: 'var(--kn-accent)', color: '#fff', border: 'none',
          borderRadius: 'var(--kn-r-md)', padding: '8px 24px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        확인
      </button>
    </div>
  );

  return (
    <div style={{
      background: 'var(--kn-surface-1)',
      border: '1px solid color-mix(in oklab, var(--kn-accent) 40%, transparent)',
      borderRadius: 'var(--kn-r-xl)',
      boxShadow: '0 2px 14px color-mix(in oklab, var(--kn-accent) 10%, transparent)',
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* 상단 강조 스트라이프 */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--kn-accent-light, #f5a623), var(--kn-accent))' }} />

      <div style={{ padding: '18px 22px 20px' }}>

        {/* 헤드라인 + 닫기 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Icon name="coffee" size={22} color="var(--kn-accent)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{headline}</div>
              <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', lineHeight: 1.55 }}>{desc}</div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--kn-text-dim)', flexShrink: 0, padding: '2px 4px',
              borderRadius: 6, lineHeight: 1,
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* 금액 칩 + 계좌 */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* 추천 금액 */}
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>추천 금액</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {amounts.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  style={{
                    flex: 1, padding: '9px 4px', borderRadius: 8,
                    border: `1px solid ${selected === i ? 'color-mix(in oklab, var(--kn-accent) 60%, transparent)' : 'var(--kn-border)'}`,
                    background: selected === i ? 'color-mix(in oklab, var(--kn-accent) 10%, transparent)' : 'var(--kn-surface-1)',
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--kn-text)', marginBottom: 2 }}>{a.label}</span>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--kn-text-dim)' }}>{a.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 계좌 정보 */}
          <div style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>계좌 정보</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)',
              borderRadius: 8, padding: '10px 13px', marginBottom: 8,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', marginBottom: 2 }}>{ACCOUNT_BANK}</div>
                <div style={{ fontFamily: 'var(--kn-font-mono)', fontSize: 15, fontWeight: 500, letterSpacing: '.02em' }}>{ACCOUNT_NUMBER}</div>
                <div style={{ fontSize: 11, color: 'var(--kn-text-dim)', marginTop: 1 }}>{ACCOUNT_HOLDER}</div>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: copied ? 'var(--kn-success, #2a7a48)' : 'var(--kn-accent)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 14px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', flexShrink: 0, transition: 'background .15s',
                }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={13} color="#fff" />
                {copied ? '완료' : '복사'}
              </button>
            </div>
            <button
              onClick={() => setShowThanks(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'color-mix(in oklab, var(--kn-accent) 10%, transparent)',
                color: 'var(--kn-accent)',
                border: '1px solid color-mix(in oklab, var(--kn-accent) 40%, transparent)',
                borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Icon name="coffee" size={15} color="var(--kn-accent)" />
              후원 완료했어요!
            </button>
          </div>
        </div>

        <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          후원은 강요가 아닙니다. 부담 없이 즐겨주세요 💛
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  이어하기 알림 모달 (비호스트용)
// ─────────────────────────────────────────

function RematchModal({ nextSessionName, onJoin, onLater }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--kn-surface-1)',
        border: '1px solid var(--kn-border-strong)',
        borderRadius: 'var(--kn-r-xl)',
        padding: '28px 28px 24px',
        maxWidth: 400, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'color-mix(in oklab, var(--kn-accent) 15%, transparent)',
            border: '1px solid color-mix(in oklab, var(--kn-accent) 40%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="zap" size={20} color="var(--kn-accent)" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'var(--kn-w-bold)' }}>
              다음 킬내기가 생성되었습니다
            </div>
            <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginTop: 2 }}>
              참여하시겠습니까?
            </div>
          </div>
        </div>

        {nextSessionName && (
          <div style={{
            background: 'var(--kn-surface-2)',
            border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-md)',
            padding: '10px 14px',
            fontSize: 13, color: 'var(--kn-text)',
          }}>
            {nextSessionName}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            style={{ flex: 1 }}
            onClick={onLater}
          >
            다음에 참여하기
          </Button>
          <Button
            variant="primary"
            style={{ flex: 1 }}
            icon="arrow"
            onClick={onJoin}
          >
            바로 참여
          </Button>
        </div>
      </div>
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

  const [renewing,       setRenewing]       = useState(false);
  const [renewError,     setRenewError]     = useState('');
  const [rematchModal,   setRematchModal]   = useState(null); // { roomCode, name } — 모달 표시 중
  const [nextSession,    setNextSession]    = useState(null); // { roomCode, name } — 모달 닫은 후 유지
  const [showDonation,   setShowDonation]   = useState(true);

  const isHost = room && user && room.hostUserId === user.id;

  // ─ WebSocket: 결과 페이지에 머무르는 동안 기존 세션 토픽 구독
  const handleWsMessage = useCallback((envelope) => {
    if (envelope.type === 'SESSION_RENEWED' && envelope.data) {
      const { roomCode: nextRoomCode, name: nextName } = envelope.data;
      setRematchModal({ roomCode: nextRoomCode, name: nextName });
    }
  }, []);

  // sessionId가 확정된 후에만 WebSocket 연결 (호스트는 자신이 만든 방이므로 구독 불필요)
  const wsEnabled = !!room?.id && !isHost;
  useWebSocket(room?.id, handleWsMessage, wsEnabled);

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

  const handleRenew = async () => {
    if (!room?.id) return;
    setRenewError('');
    setRenewing(true);
    const res = await RoomAPI.renew(room.id);
    setRenewing(false);

    if (!res.success) {
      setRenewError(res.error || '새 방 생성에 실패했습니다');
      return;
    }
    // 호스트도 모달로 이동 여부 선택 (즉시 이동 or 나중에)
    setRematchModal({ roomCode: res.data.roomCode, name: res.data.name });
  };

  const handleRematchJoin = () => {
    if (rematchModal) router.push(`/room/${rematchModal.roomCode}/setup`);
  };

  const handleRematchLater = () => {
    if (rematchModal) setNextSession(rematchModal); // 모달 닫은 뒤에도 참여 버튼 유지
    setRematchModal(null);
  };

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

  const teamScores = scoreboard
    ? [...scoreboard.teams]
        .map((t) => ({
          id:           t.teamId,
          name:         t.teamName,
          leaderUserId: t.leaderUserId ?? null,
          kills:        t.totalKills,
          bonus:        Math.max(0, t.ruleScore),
          penalty:      Math.max(0, -t.ruleScore),
          adj:          t.adjustmentScore ?? 0,
          total:        t.effectiveKills,
          members:      t.members || [],
        }))
        .sort((a, b) => b.total - a.total)
    : [];

  const winner = teamScores[0];

  // leaderUserId로 현재 유저가 우승 팀 리더인지 정확하게 판단
  const isOnWinningTeam = !!(winner && user && winner.leaderUserId === user.id);

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

      {/* 이어하기 알림 모달 */}
      {rematchModal && (
        <RematchModal
          nextSessionName={rematchModal.name}
          onJoin={handleRematchJoin}
          onLater={handleRematchLater}
        />
      )}

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

        {/* 후원 배너 */}
        {showDonation && (
          <DonationBanner
            isWinner={isOnWinningTeam}
            onDismiss={() => setShowDonation(false)}
          />
        )}

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
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

          {/* 이어서 킬내기 참여 배너 — 모달에서 "다음에 참여하기" 선택 후 활성화 */}
          {nextSession && (
            <div style={{
              width: '100%', maxWidth: 480,
              background: 'color-mix(in oklab, var(--kn-accent) 8%, transparent)',
              border: '1px solid color-mix(in oklab, var(--kn-accent) 35%, transparent)',
              borderRadius: 'var(--kn-r-lg)',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <Icon name="zap" size={20} color="var(--kn-accent)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 2 }}>다음 킬내기 준비 완료</div>
                <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: 'var(--kn-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {nextSession.name}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon="arrow"
                onClick={() => router.push(`/room/${nextSession.roomCode}/setup`)}
                style={{ flexShrink: 0 }}
              >
                참여하기
              </Button>
            </div>
          )}

          {/* 이어하기 시작 버튼 — 새 방이 아직 만들어지지 않은 경우에만 표시 */}
          {!nextSession && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Button
                variant="primary"
                size="lg"
                icon="zap"
                style={{ minWidth: 220 }}
                onClick={isHost ? handleRenew : undefined}
                loading={renewing}
                disabled={!isHost || renewing}
                title={isHost ? undefined : '호스트만 다음 킬내기를 시작할 수 있습니다'}
              >
                이어서 킬내기 시작
              </Button>
              {!isHost && (
                <div style={{ fontSize: 11, color: 'var(--kn-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="alert" size={12} />
                  호스트가 다음 킬내기를 생성하면 알림이 표시됩니다
                </div>
              )}
              {renewError && (
                <div style={{ fontSize: 12, color: 'var(--kn-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="alert" size={13} /> {renewError}
                </div>
              )}
            </div>
          )}

          <Button variant="secondary" size="lg" onClick={() => router.push('/dashboard')} icon="back" style={{ minWidth: 200 }}>
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
