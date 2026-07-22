'use client';

import Link from 'next/link';
import { useAdminMetrics } from '@/features/admin/hooks/useAdminMetrics';

const SESSION_STATUS_LABELS = {
  WAITING: '대기 중',
  IN_PROGRESS: '진행 중',
  ENDED: '종료',
};

export default function AdminPage() {
  const { metrics, status } = useAdminMetrics();

  if (status === 'loading') {
    return <CenterMessage>지표를 불러오는 중…</CenterMessage>;
  }
  if (status === 'forbidden') {
    return <CenterMessage>접근 권한이 없습니다.</CenterMessage>;
  }
  if (status === 'error') {
    return <CenterMessage>지표를 불러오지 못했습니다.</CenterMessage>;
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'var(--kn-w-bold)' }}>운영 지표</h1>
          <Link href="/admin/sessions" style={{ color: 'var(--kn-accent)', fontSize: 13 }}>세션 드릴다운 →</Link>
        </div>

        <MetricGroup title="성장">
          <MetricCard label="총 가입 유저" value={metrics.totalUsers} />
          <MetricCard label="신규 가입 (7일)" value={metrics.newUsers7d} />
          <MetricCard label="신규 가입 (30일)" value={metrics.newUsers30d} />
        </MetricGroup>

        <MetricGroup title="세션">
          <MetricCard label="총 세션 수" value={metrics.totalSessions} />
          <StatusBreakdownCard label="상태별 세션" breakdown={metrics.sessionsByStatus} />
        </MetricGroup>

        <MetricGroup title="참여">
          <MetricCard label="세션당 평균 참가자" value={metrics.avgParticipantsPerSession} />
          <MetricCard label="유저당 평균 참여 세션" value={metrics.avgSessionsPerUser} />
        </MetricGroup>

        <MetricGroup title="활성">
          <MetricCard label="활성 유저 (7일)" value={metrics.activeUsers7d} />
          <MetricCard label="활성 유저 (30일)" value={metrics.activeUsers30d} />
        </MetricGroup>

        <MetricGroup title="리텐션">
          <MetricCard label="W1 리텐션 (가입 첫 주 참여율)" value={metrics.w1RetentionRate} suffix="%" />
        </MetricGroup>
      </div>
    </main>
  );
}

function MetricGroup({ title, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 13, fontWeight: 'var(--kn-w-label)', color: 'var(--kn-text-muted)', marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {children}
      </div>
    </section>
  );
}

const cardStyle = {
  background: 'var(--kn-surface-1)',
  border: '1px solid var(--kn-border)',
  borderRadius: 12,
  padding: 20,
};

function MetricCard({ label, value, suffix = '' }) {
  return (
    <div style={cardStyle}>
      <p style={{ fontSize: 13, color: 'var(--kn-text-muted)' }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 'var(--kn-w-bold)', marginTop: 8 }}>
        {value}
        {suffix}
      </p>
    </div>
  );
}

function StatusBreakdownCard({ label, breakdown }) {
  const entries = Object.entries(breakdown ?? {});
  return (
    <div style={cardStyle}>
      <p style={{ fontSize: 13, color: 'var(--kn-text-muted)' }}>{label}</p>
      <ul style={{ marginTop: 8, listStyle: 'none', padding: 0 }}>
        {entries.map(([statusKey, count]) => (
          <li key={statusKey} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ color: 'var(--kn-text-muted)' }}>
              {SESSION_STATUS_LABELS[statusKey] ?? statusKey}
            </span>
            <span style={{ fontWeight: 'var(--kn-w-bold)' }}>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CenterMessage({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}
