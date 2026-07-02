const ROLE_MAP = {
  HOST:        { label: '방장',   color: 'var(--kn-accent)' },
  LEADER:      { label: '리더',   color: 'var(--kn-warning)' },
  PARTICIPANT: { label: '참여자', color: 'var(--kn-text-muted)' },
};

export default function RoleBadge({ role }) {
  const r = ROLE_MAP[role] || ROLE_MAP.PARTICIPANT;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 'var(--kn-r-sm)', border: `1px solid color-mix(in oklab, ${r.color} 25%, transparent)`, background: `color-mix(in oklab, ${r.color} 12%, transparent)`, color: r.color, fontSize: 11, fontWeight: 500, lineHeight: 1 }}>
      {r.label}
    </span>
  );
}
