/**
 * Button 컴포넌트
 *
 * Props:
 *   variant  : 'primary' | 'secondary' | 'ghost' | 'danger'  (기본: primary)
 *   size     : 'sm' | 'md' | 'lg'  (기본: md)
 *   loading  : boolean  로딩 스피너 표시
 *   disabled : boolean
 *   fullWidth: boolean  width: 100%
 */

'use client';

const VARIANTS = {
  primary:   { background: '#F5A623', color: '#1a1500', border: 'none' },
  secondary: { background: 'transparent', color: '#E8DFC0', border: '1px solid rgba(200,155,0,0.35)' },
  ghost:     { background: 'rgba(200,155,0,0.08)', color: '#F5A623', border: '1px solid rgba(200,155,0,0.3)' },
  danger:    { background: 'transparent', color: '#E53935', border: '1px solid rgba(229,57,53,0.5)' },
};

const SIZES = {
  sm: { padding: '6px 14px',  fontSize: 12 },
  md: { padding: '10px 18px', fontSize: 13 },
  lg: { padding: '14px 24px', fontSize: 15 },
};

export default function Button({
  children,
  onClick,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  style = {},
  type = 'button',
}) {
  const vs = VARIANTS[variant] || VARIANTS.primary;
  const sz = SIZES[size]       || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...vs,
        ...sz,
        width: fullWidth ? '100%' : undefined,
        borderRadius: 4,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        fontFamily: 'inherit',
        opacity: isDisabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        transition: 'opacity .15s',
        ...style,
      }}
    >
      {loading && (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 13 }}>
          ⟳
        </span>
      )}
      {children}
    </button>
  );
}
