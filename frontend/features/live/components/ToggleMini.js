export default function ToggleMini({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 34, height: 18, borderRadius: 9,
        background: on ? 'var(--kn-accent)' : 'var(--kn-surface-3)',
        border: '1px solid var(--kn-border)',
        cursor: 'pointer', position: 'relative', display: 'inline-block', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 1, left: on ? 16 : 1,
        width: 14, height: 14, borderRadius: '50%',
        background: on ? 'var(--kn-bg)' : 'var(--kn-text-muted)',
        transition: 'left .15s',
      }} />
    </div>
  );
}
