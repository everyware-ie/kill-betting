import Icon from '@/components/ui/Icon';

const RANK_STYLES = {
  1: { bg: 'var(--kn-accent-bg)', border: 'var(--kn-accent)', color: 'var(--kn-accent)', icon: 'trophy' },
  2: { bg: 'var(--kn-surface-3)', border: 'var(--kn-border-strong)', color: 'var(--kn-text-muted)', icon: 'shield' },
  3: { bg: 'var(--kn-surface-3)', border: 'var(--kn-border)', color: 'var(--kn-text-dim)', icon: 'shield' },
};

export default function RankBadge({ rank }) {
  const s = RANK_STYLES[rank] || { bg: 'transparent', border: 'var(--kn-border)', color: 'var(--kn-text-dim)', icon: null };
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: s.color, flexShrink: 0 }}>
      {s.icon ? <Icon name={s.icon} size={20} color={s.color} /> : `#${rank}`}
    </div>
  );
}
