'use client';

import { useState } from 'react';

export default function CopyCodeBadge({ code }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

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
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  const borderColor = copied
    ? 'rgba(76,175,80,0.5)'
    : copyFailed
      ? 'rgba(229,57,53,0.5)'
      : 'rgba(200,155,0,0.25)';

  const textColor = copied ? '#4CAF50' : copyFailed ? '#E53935' : '#8A8060';
  const codeColor = copied ? '#4CAF50' : copyFailed ? '#E53935' : '#F5A623';
  const label = copied ? '✓ 복사됨' : copyFailed ? '✕ 복사 실패' : '초대 코드  📋';

  return (
    <button
      onClick={handleCopy}
      title="클릭하면 코드를 복사합니다"
      style={{
        background: '#141200',
        border: `1px solid ${borderColor}`,
        borderRadius: 4, padding: '4px 12px',
        textAlign: 'center', cursor: 'pointer',
        transition: 'border-color .2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
      }}
    >
      <div style={{ fontSize: 9, color: textColor, letterSpacing: 1.5 }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700,
        fontFamily: "'Share Tech Mono', monospace",
        color: codeColor,
        letterSpacing: 2,
      }}>
        {code ?? '—'}
      </div>
    </button>
  );
}