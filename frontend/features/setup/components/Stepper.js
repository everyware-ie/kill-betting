export default function Stepper({ value, onChange, min = 0, max = 99, disabled }) {
  return (
    <div style={{ display: 'flex' }}>
      <button
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 28, height: 30, background: '#141200',
          border: '1px solid rgba(200,155,0,0.25)',
          borderRadius: '4px 0 0 4px', color: '#F5A623',
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
          background: '#141200',
          border: '1px solid rgba(200,155,0,0.3)',
          borderLeft: 'none', borderRight: 'none',
          color: '#F5A623', fontSize: 14, fontWeight: 700,
          outline: 'none', fontFamily: 'inherit',
          opacity: disabled ? 0.4 : 1,
        }}
      />
      <button
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 28, height: 30, background: '#141200',
          border: '1px solid rgba(200,155,0,0.25)',
          borderRadius: '0 4px 4px 0', color: '#F5A623',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
          opacity: disabled ? 0.4 : 1,
        }}
      >+</button>
    </div>
  );
}