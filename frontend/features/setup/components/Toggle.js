export default function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? 'var(--kn-accent)' : 'var(--kn-surface-3)',
        border: '1px solid var(--kn-border)',
        cursor: 'pointer', position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 19 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: on ? 'var(--kn-bg)' : 'var(--kn-text-muted)',
        transition: 'left .2s',
      }} />
    </div>
  );
}
