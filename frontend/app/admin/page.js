'use client';

import { useAdminMetrics } from '@/features/admin/hooks/useAdminMetrics';

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
        <h1 className="mb-6 text-2xl font-bold">운영 지표</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="총 가입 유저" value={metrics.totalUsers} />
        </div>
      </div>
    </main>
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

function CenterMessage({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--kn-bg)] text-[var(--kn-text-muted)]">
      {children}
    </main>
  );
}
