'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminSessionDetail } from '@/features/admin/hooks/useAdminSessionDetail';

const STATUS_LABELS = { WAITING: '대기 중', IN_PROGRESS: '진행 중', ENDED: '종료' };

export default function AdminSessionDetailPage() {
  const { sessionId } = useParams();
  const { detail, state } = useAdminSessionDetail(sessionId);

  if (state === 'loading') return <Center>세션 상세를 불러오는 중…</Center>;
  if (state === 'forbidden') return <Center>접근 권한이 없습니다.</Center>;
  if (state === 'notFound') return <Center>세션을 찾을 수 없습니다.</Center>;
  if (state === 'error') return <Center>세션 상세를 불러오지 못했습니다.</Center>;

  const { meta, teams, matchHistory, scoreboard } = detail;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Link href="/admin/sessions" style={{ color: 'var(--kn-text-muted)', fontSize: 13 }}>← 세션 목록</Link>
        <h1 style={{ fontSize: 24, fontWeight: 'var(--kn-w-bold)', margin: '12px 0 24px' }}>{meta.name}</h1>

        <Section title="세션 정보">
          <MetaGrid meta={meta} />
        </Section>

        <Section title={`참가자 / 팀 (${teams.length})`}>
          {teams.length === 0 ? <Muted>구성된 팀이 없습니다.</Muted> : teams.map((t) => (
            <Row key={t.id}>
              <span style={{ fontWeight: 'var(--kn-w-bold)' }}>{t.name}</span>
              <span style={{ color: 'var(--kn-text-muted)' }}>{(t.players ?? []).join(', ') || '-'}</span>
            </Row>
          ))}
        </Section>

        <Section title={`스코어보드${scoreboard.winnerTeamName ? ` · 우승: ${scoreboard.winnerTeamName}` : ''}`}>
          {(scoreboard.teams ?? []).length === 0 ? <Muted>집계된 점수가 없습니다.</Muted> : scoreboard.teams.map((t) => (
            <Row key={t.teamId}>
              <span>{t.teamName}</span>
              <span style={{ color: 'var(--kn-text-muted)' }}>킬 {t.totalKills} · 점수 {t.effectiveKills}</span>
            </Row>
          ))}
        </Section>

        <Section title={`매치별 결과 (${matchHistory.confirmedMatchCount})`}>
          {(matchHistory.matches ?? []).length === 0 ? <Muted>확정된 매치가 없습니다.</Muted> : matchHistory.matches.map((m) => (
            <Row key={m.matchId}>
              <span>매치 {m.matchNumber}{m.mapName ? ` · ${m.mapName}` : ''}</span>
              <span style={{ color: 'var(--kn-text-muted)' }}>결과 {(m.memberResults ?? []).length}건</span>
            </Row>
          ))}
        </Section>
      </div>
    </main>
  );
}

function MetaGrid({ meta }) {
  const items = [
    ['호스트', meta.hostNickname],
    ['상태', STATUS_LABELS[meta.status] ?? meta.status],
    ['방 코드', meta.roomCode],
    ['목표 킬', meta.targetKills ?? '-'],
    ['제한 시간', meta.timeLimitMinutes ? `${meta.timeLimitMinutes}분` : '-'],
    ['생성 시각', meta.createdAt ? meta.createdAt.replace('T', ' ').slice(0, 16) : '-'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      {items.map(([label, value]) => (
        <div key={label}>
          <p style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>{label}</p>
          <p style={{ fontSize: 15, marginTop: 2 }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 'var(--kn-w-label)', color: 'var(--kn-text-muted)', marginBottom: 10 }}>{title}</h2>
      <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 12, padding: 16 }}>
        {children}
      </div>
    </section>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--kn-border)' }}>
      {children}
    </div>
  );
}

function Muted({ children }) {
  return <p style={{ color: 'var(--kn-text-muted)', fontSize: 14 }}>{children}</p>;
}

function Center({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}