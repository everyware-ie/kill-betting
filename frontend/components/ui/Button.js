'use client';

import Icon from './Icon';

const VARIANTS = {
  primary: {
    background: 'var(--kn-accent)',
    color: 'oklch(15% 0.005 250)',
    border: '1px solid transparent',
    fontWeight: 'var(--kn-w-bold)',
  },
  secondary: {
    background: 'var(--kn-surface-2)',
    color: 'var(--kn-text)',
    border: '1px solid var(--kn-border-strong)',
    fontWeight: 500,
  },
  ghost: {
    background: 'transparent',
    color: 'var(--kn-text)',
    border: '1px solid transparent',
    fontWeight: 500,
  },
  outline: {
    background: 'transparent',
    color: 'var(--kn-text)',
    border: '1px solid var(--kn-border-strong)',
    fontWeight: 500,
  },
  danger: {
    background: 'transparent',
    color: 'var(--kn-danger)',
    border: '1px solid color-mix(in oklab, var(--kn-danger) 40%, transparent)',
    fontWeight: 500,
  },
  accent: {
    background: 'var(--kn-accent-bg)',
    color: 'var(--kn-accent)',
    border: '1px solid color-mix(in oklab, var(--kn-accent) 30%, transparent)',
    fontWeight: 'var(--kn-w-semi)',
  },
};

const SIZES = {
  sm: { h: 28, px: 12, fs: 12, gap: 6, iSize: 14 },
  md: { h: 36, px: 14, fs: 13, gap: 7, iSize: 16 },
  lg: { h: 44, px: 18, fs: 14, gap: 8, iSize: 18 },
};

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  style = {},
}) {
  const isDisabled = disabled || loading;
  const vs = VARIANTS[variant] || VARIANTS.primary;
  const sz = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        height: sz.h,
        padding: `0 ${sz.px}px`,
        fontSize: sz.fs,
        gap: sz.gap,
        fontFamily: 'inherit',
        letterSpacing: '-0.005em',
        borderRadius: 'var(--kn-r-md)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: fullWidth ? '100%' : undefined,
        transition: 'background .15s, color .15s, opacity .15s, border-color .15s',
        ...vs,
        ...style,
      }}
    >
      {loading
        ? <Icon name="spinner" size={sz.iSize} style={{ animation: 'kn-spin 0.9s linear infinite' }} />
        : icon && <Icon name={icon} size={sz.iSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sz.iSize} />}
    </button>
  );
}