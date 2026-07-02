const STATUS_MAP = {
  WAITING:     { label: '대기 중', color: 'var(--kn-warning)', live: false },
  IN_PROGRESS: { label: '진행 중', color: 'var(--kn-success)', live: true },
  ENDED:       { label: '종료됨',  color: 'var(--kn-text-dim)', live: false },
  LIVE:        { label: '진행 중', color: 'var(--kn-success)', live: true },
  DONE:        { label: '종료됨',  color: 'var(--kn-text-dim)', live: false },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.ENDED;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 'var(--kn-r-sm)', border: `1px solid color-mix(in oklab, ${s.color} 25%, transparent)`, background: `color-mix(in oklab, ${s.color} 12%, transparent)`, color: s.color, fontSize: 11, fontWeight: 500, lineHeight: 1 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, animation: s.live ? 'kn-pulse 1.4s infinite' : 'none' }} />
      {s.label}
    </span>
  );
}
