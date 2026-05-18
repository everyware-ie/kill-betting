export default function Stepper({ value, onChange, min = 0, max = 99, disabled }) {
  return (
    <div style={{ display: 'flex' }}>
      <button
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 28, height: 30, background: 'var(--kn-surface-3)',
          border: '1px solid var(--kn-border-strong)',
          borderRadius: 'var(--kn-r-md) 0 0 var(--kn-r-md)',
          color: 'var(--kn-accent)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
          opacity: disabled ? 0.4 : 1,
        }}
      >−</button>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v) && v >= min && v <= max) onChange(v);
        }}
        style={{
          width: 48, height: 30, textAlign: 'center',
          background: 'var(--kn-surface-3)',
          border: '1px solid var(--kn-border-strong)',
          borderLeft: 'none', borderRight: 'none',
          color: 'var(--kn-accent)', fontSize: 14, fontWeight: 700,
          outline: 'none', fontFamily: 'var(--kn-font-mono)',
          opacity: disabled ? 0.4 : 1,
        }}
      />
      <button
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 28, height: 30, background: 'var(--kn-surface-3)',
          border: '1px solid var(--kn-border-strong)',
          borderRadius: '0 var(--kn-r-md) var(--kn-r-md) 0',
          color: 'var(--kn-accent)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
          opacity: disabled ? 0.4 : 1,
        }}
      >+</button>
    </div>
  );
}
