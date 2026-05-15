'use client';

import Icon from '../ui/Icon';

function KnBrand({ size = 28 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size,
        background: 'var(--kn-accent)',
        display: 'grid', placeItems: 'center',
        borderRadius: 'var(--kn-r-sm)',
      }}>
        <Icon name="target" size={size * 0.62} color="var(--kn-bg)" strokeWidth={2} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span data-label="" style={{ fontSize: 9,  lineHeight: 1.5 }}>KILL · CHALLENGE</span>
        <span style={{ fontSize: size * 0.55, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.02em' }}>
          Killnagi
        </span>
      </div>
    </div>
  );
}

export { KnBrand };

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--kn-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* subtle background dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--kn-border-strong) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 400,
        background: 'var(--kn-surface-1)',
        border: '1px solid var(--kn-border)',
        borderRadius: 'var(--kn-r-xl)',
        padding: 32,
        display: 'flex', flexDirection: 'column', gap: 18,
        animation: 'kn-fade-in .25s ease-out',
      }}>
        <KnBrand size={32} />
        {children}
      </div>
    </div>
  );
}
