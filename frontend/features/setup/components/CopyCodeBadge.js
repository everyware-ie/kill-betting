'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';

export default function CopyCodeBadge({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    let success = false;
    try {
      await navigator.clipboard.writeText(code);
      success = true;
    } catch {
      const el = document.createElement('input');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      success = document.execCommand('copy');
      document.body.removeChild(el);
    }
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 34 }}>
      {/* 코드 표시 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--kn-surface-3)',
        border: '1px solid var(--kn-border)',
        borderRight: 'none',
        borderRadius: 'var(--kn-r-md) 0 0 var(--kn-r-md)',
        padding: '0 12px',
        height: '100%',
      }}>
        <Icon name="hash" size={13} color="var(--kn-text-muted)" />
        <span data-mono="" style={{
          fontSize: 13,
          fontWeight: 'var(--kn-w-bold)',
          color: 'var(--kn-text)',
          letterSpacing: 1.5,
        }}>
          {code ?? '—'}
        </span>
      </div>

      {/* 복사 버튼 */}
      <button
        onClick={handleCopy}
        title="초대 코드 복사"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--kn-surface-3)',
          border: '1px solid var(--kn-border)',
          borderRadius: '0 var(--kn-r-md) var(--kn-r-md) 0',
          padding: '0 10px',
          height: '100%',
          cursor: 'pointer',
          color: copied ? 'var(--kn-success)' : 'var(--kn-text-muted)',
          fontSize: 12,
          fontFamily: 'inherit',
          transition: 'color .2s',
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} size={13} />
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  );
}