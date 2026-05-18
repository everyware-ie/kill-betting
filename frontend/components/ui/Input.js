'use client';

import Icon from './Icon';

export default function Input({
  label,
  hint,
  error,
  success,
  prefix,
  suffix,
  mono = false,
  style = {},
  containerStyle = {},
  ...props
}) {
  const borderColor = error
    ? 'var(--kn-danger)'
    : success
    ? 'var(--kn-success)'
    : 'var(--kn-border-strong)';

  return (
    <label style={{ display: 'block', ...containerStyle }}>
      {(label || hint) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          {label && <span data-label="">{label}</span>}
          {hint && <span style={{ fontSize: 11, color: 'var(--kn-text-dim)' }}>{hint}</span>}
        </div>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--kn-text-dim)', pointerEvents: 'none', display: 'flex',
          }}>
            {typeof prefix === 'string' ? <Icon name={prefix} size={16} /> : prefix}
          </span>
        )}
        <input
          style={{
            width: '100%',
            height: 'var(--kn-ctrl-h)',
            paddingLeft: prefix ? 36 : 12,
            paddingRight: suffix ? 36 : 12,
            background: 'var(--kn-surface-3)',
            border: `1px solid ${borderColor}`,
            color: 'var(--kn-text)',
            borderRadius: 'var(--kn-r-md)',
            fontSize: 'var(--kn-fs)',
            fontFamily: mono ? 'var(--kn-font-mono)' : 'inherit',
            outline: 'none',
            transition: 'border-color .15s, background .15s',
            ...style,
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--kn-accent)'; e.target.style.background = 'var(--kn-surface-2)'; }}
          onBlur={(e) => { e.target.style.borderColor = borderColor; e.target.style.background = 'var(--kn-surface-3)'; }}
          {...props}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--kn-text-muted)', display: 'flex',
          }}>
            {typeof suffix === 'string' ? <Icon name={suffix} size={16} /> : suffix}
          </span>
        )}
      </div>

      {(error || success) && (
        <div style={{
          marginTop: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
          color: error ? 'var(--kn-danger)' : 'var(--kn-success)',
        }}>
          <Icon name={error ? 'alert' : 'check'} size={14} />
          {error || success}
        </div>
      )}
    </label>
  );
}