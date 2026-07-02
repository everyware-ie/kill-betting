'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';

const ACCOUNT_NUMBER = '79794767093';
const ACCOUNT_BANK   = '카카오뱅크';
const ACCOUNT_HOLDER = '박지응';

const AMOUNTS = [
  { label: '1,000원', sub: '아메리카노 1/5' },
  { label: '3,000원', sub: '반 잔 정도' },
  { label: '5,000원', sub: '커피 한 잔 ☕' },
  { label: '10,000원', sub: '라떼도 돼요' },
];

export default function DonationBanner({ isWinner, onDismiss }) {
  const [copied,     setCopied]     = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [selected,   setSelected]   = useState(2);

  const headline = isWinner
    ? '🎉 축하해요! 오늘 킬내기 승리를 커피 한 잔으로 더 달콤하게!'
    : '오늘은 졌지만 분풀이 대신 커피 한 잔 어떨까요? ☕';
  const desc = isWinner
    ? '멋진 승리였어요! 기쁜 날, 친구들이 만든 서비스에 커피 한 잔 후원해주시면 정말 큰 힘이 돼요 🏆'
    : '지는 날도 있죠. 친구들이 만든 작은 사이드 프로젝트예요. 위로의 커피 한 잔 부탁드려요 💛';

  function handleCopy() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  if (showThanks) return (
    <div style={{ background: 'var(--kn-surface-1)', border: '1px solid color-mix(in oklab, var(--kn-accent) 50%, transparent)', borderRadius: 'var(--kn-r-xl)', padding: '24px 28px', marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <Icon name="coffee" size={36} color="var(--kn-accent)" />
      <div style={{ fontSize: 17, fontWeight: 700 }}>감사합니다!</div>
      <div style={{ fontSize: 13, color: 'var(--kn-text-muted)', lineHeight: 1.6 }}>
        소중한 커피 한 잔 덕분에<br />오늘도 개발을 이어갈 수 있어요.<br /><strong>다음 매치도 즐기러 오세요!</strong>
      </div>
      <button onClick={onDismiss} style={{ marginTop: 4, background: 'var(--kn-accent)', color: '#fff', border: 'none', borderRadius: 'var(--kn-r-md)', padding: '8px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        확인
      </button>
    </div>
  );

  return (
    <div style={{ background: 'var(--kn-surface-1)', border: '1px solid color-mix(in oklab, var(--kn-accent) 40%, transparent)', borderRadius: 'var(--kn-r-xl)', boxShadow: '0 2px 14px color-mix(in oklab, var(--kn-accent) 10%, transparent)', overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--kn-accent-light, #f5a623), var(--kn-accent))' }} />
      <div style={{ padding: '18px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Icon name="coffee" size={22} color="var(--kn-accent)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{headline}</div>
              <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', lineHeight: 1.55 }}>{desc}</div>
            </div>
          </div>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kn-text-dim)', flexShrink: 0, padding: '2px 4px', borderRadius: 6, lineHeight: 1 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>추천 금액</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {AMOUNTS.map((a, i) => (
                <button key={i} onClick={() => setSelected(i)} style={{ flex: 1, padding: '9px 4px', borderRadius: 8, border: `1px solid ${selected === i ? 'color-mix(in oklab, var(--kn-accent) 60%, transparent)' : 'var(--kn-border)'}`, background: selected === i ? 'color-mix(in oklab, var(--kn-accent) 10%, transparent)' : 'var(--kn-surface-1)', cursor: 'pointer', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--kn-text)', marginBottom: 2 }}>{a.label}</span>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--kn-text-dim)' }}>{a.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>계좌 정보</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 8, padding: '10px 13px', marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', marginBottom: 2 }}>{ACCOUNT_BANK}</div>
                <div style={{ fontFamily: 'var(--kn-font-mono)', fontSize: 15, fontWeight: 500, letterSpacing: '.02em' }}>{ACCOUNT_NUMBER}</div>
                <div style={{ fontSize: 11, color: 'var(--kn-text-dim)', marginTop: 1 }}>{ACCOUNT_HOLDER}</div>
              </div>
              <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'var(--kn-success, #2a7a48)' : 'var(--kn-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'background .15s' }}>
                <Icon name={copied ? 'check' : 'copy'} size={13} color="#fff" />
                {copied ? '완료' : '복사'}
              </button>
            </div>
            <button onClick={() => setShowThanks(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'color-mix(in oklab, var(--kn-accent) 10%, transparent)', color: 'var(--kn-accent)', border: '1px solid color-mix(in oklab, var(--kn-accent) 40%, transparent)', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Icon name="coffee" size={15} color="var(--kn-accent)" />
              후원 완료했어요!
            </button>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--kn-text-dim)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>후원은 강요가 아닙니다. 부담 없이 즐겨주세요 💛</div>
      </div>
    </div>
  );
}
