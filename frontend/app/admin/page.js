'use client';

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
    <main className="min-h-screen bg-[var(--kn-bg)] px-6 py-10 text-[var(--kn-text)]">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold">운영 지표</h1>

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
      </div>
    </main>
  );
}

function MetricGroup({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-[var(--kn-text-muted)]">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--kn-border)] bg-[var(--kn-surface-1)] p-5">
      <p className="text-sm text-[var(--kn-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBreakdownCard({ label, breakdown }) {
  const entries = Object.entries(breakdown ?? {});
  return (
    <div className="rounded-xl border border-[var(--kn-border)] bg-[var(--kn-surface-1)] p-5">
      <p className="text-sm text-[var(--kn-text-muted)]">{label}</p>
      <ul className="mt-2 space-y-1">
        {entries.map(([statusKey, count]) => (
          <li key={statusKey} className="flex justify-between text-base">
            <span className="text-[var(--kn-text-muted)]">
              {SESSION_STATUS_LABELS[statusKey] ?? statusKey}
            </span>
            <span className="font-semibold">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CenterMessage({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--kn-bg)] text-[var(--kn-text-muted)]">
      {children}
    </main>
  );
}