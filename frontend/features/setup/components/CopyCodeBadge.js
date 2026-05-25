'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('input');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

export default function CopyCodeBadge({ code }) {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyCode = async () => {
    if (!code) return;
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    if (!code) return;
    const codeParam = code.replace(/^#/, '');
    const url = `${window.location.origin}/room/${codeParam}`;
    if (await copyText(url)) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'var(--kn-surface-3)',
    border: '1px solid var(--kn-border)',
    borderLeft: 'none',
    padding: '0 10px',
    height: '100%',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    transition: 'color .2s',
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

      {/* 코드 복사 버튼 */}
      <button
        onClick={handleCopyCode}
        title="초대 코드 복사"
        style={{
          ...btnBase,
          color: copied ? 'var(--kn-success)' : 'var(--kn-text-muted)',
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} size={13} />
        {copied ? '복사됨' : '복사'}
      </button>

      {/* URL 복사 버튼 */}
      <button
        onClick={handleCopyUrl}
        title="접속 URL 복사"
        style={{
          ...btnBase,
          borderRadius: '0 var(--kn-r-md) var(--kn-r-md) 0',
          color: copiedUrl ? 'var(--kn-success)' : 'var(--kn-text-muted)',
        }}
      >
        <Icon name={copiedUrl ? 'check' : 'link'} size={13} />
        {copiedUrl ? '복사됨' : 'URL'}
      </button>
    </div>
  );
}