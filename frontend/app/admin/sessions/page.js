'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminSessions } from '@/features/admin/hooks/useAdminSessions';

const STATUS_FILTERS = [
  { key: null, label: '전체' },
  { key: 'WAITING', label: '대기 중' },
  { key: 'IN_PROGRESS', label: '진행 중' },
  { key: 'ENDED', label: '종료' },
];

const STATUS_LABELS = { WAITING: '대기 중', IN_PROGRESS: '진행 중', ENDED: '종료' };

export default function AdminSessionsPage() {
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(0);
  const { data, state } = useAdminSessions({ status, page });

  const handleFilter = (key) => {
    setStatus(key);
    setPage(0);
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'var(--kn-w-bold)' }}>어드민 세션</h1>
          <Link href="/admin" style={{ color: 'var(--kn-text-muted)', fontSize: 13 }}>← 운영 지표</Link>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {STATUS_FILTERS.map((f) => (
            <FilterButton
              key={f.label}
              label={f.label}
              active={status === f.key}
              onClick={() => handleFilter(f.key)}
            />
          ))}
        </div>

        {state === 'loading' && <Message>세션을 불러오는 중…</Message>}
        {state === 'forbidden' && <Message>접근 권한이 없습니다.</Message>}
        {state === 'error' && <Message>세션 목록을 불러오지 못했습니다.</Message>}
        {state === 'ready' && data && (
          <>
            <SessionTable sessions={data.content} />
            <Pager page={page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </main>
  );
}

function SessionTable({ sessions }) {
  if (sessions.length === 0) {
    return <Message>표시할 세션이 없습니다.</Message>;
  }
  return (
    <div style={{ border: '1px solid var(--kn-border)', borderRadius: 12, overflow: 'hidden' }}>
      {sessions.map((s) => (
        <Link
          key={s.id}
          href={`/admin/sessions/${s.id}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 12,
            padding: '14px 16px',
            borderBottom: '1px solid var(--kn-border)',
            background: 'var(--kn-surface-1)',
            color: 'var(--kn-text)',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontWeight: 'var(--kn-w-bold)' }}>{s.name}</span>
          <span style={{ color: 'var(--kn-text-muted)' }}>{s.hostNickname}</span>
          <span>{STATUS_LABELS[s.status] ?? s.status}</span>
          <span style={{ textAlign: 'right', color: 'var(--kn-text-muted)' }}>참가 {s.participantCount}</span>
        </Link>
      ))}
    </div>
  );
}

function FilterButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        border: '1px solid var(--kn-border)',
        background: active ? 'var(--kn-accent)' : 'var(--kn-surface-1)',
        color: active ? 'var(--kn-bg)' : 'var(--kn-text-muted)',
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
      <button type="button" disabled={page <= 0} onClick={() => onChange(page - 1)} style={pagerBtn(page <= 0)}>
        이전
      </button>
      <span style={{ color: 'var(--kn-text-muted)', fontSize: 13 }}>
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        style={pagerBtn(page >= totalPages - 1)}
      >
        다음
      </button>
    </div>
  );
}

const pagerBtn = (disabled) => ({
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid var(--kn-border)',
  background: 'var(--kn-surface-1)',
  color: disabled ? 'var(--kn-border)' : 'var(--kn-text)',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: 13,
});

function Message({ children }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--kn-text-muted)' }}>{children}</div>
  );
}