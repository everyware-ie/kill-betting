'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Toggle from './Toggle';
import Stepper from './Stepper';

const RULES = [
  { label: '치킨 보너스', onKey: 'chickenBonusOn', valKey: 'chickenBonus', sign: '+', color: 'var(--kn-success)' },
  { label: '생존 패널티', onKey: 'survivalPenaltyOn', valKey: 'survivalPenalty', sign: '-', color: 'var(--kn-danger)' },
];

export default function RuleEditModal({ rule, onSave, onClose }) {
  const [local, setLocal] = useState({ ...rule });
  const set = (k, v) => setLocal((r) => ({ ...r, [k]: v }));

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-xl)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--kn-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'var(--kn-w-bold)' }}>룰 수정</div>
            <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 3 }}>저장 버튼을 눌러야 실제로 반영됩니다</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', width: 28, height: 28, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {/* 기본 설정 */}
          <div style={{ marginBottom: 20 }}>
            <span data-label="" style={{ marginBottom: 10, display: 'block' }}>기본 설정</span>
            <div style={{ background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--kn-border)' }}>
                <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>목표 킬 수</div>
                <Stepper value={local.targetKills} onChange={(v) => set('targetKills', v)} min={1} max={99} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>제한 시간 <span style={{ fontSize: 11, color: 'var(--kn-text-dim)' }}>{local.noTimeLimit ? '(없음)' : `(${local.timeLimitMin}분)`}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle on={local.noTimeLimit} onChange={() => set('noTimeLimit', !local.noTimeLimit)} />
                    <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>제한 없음</span>
                  </div>
                  {!local.noTimeLimit && <Stepper value={local.timeLimitMin} onChange={(v) => set('timeLimitMin', v)} min={10} max={300} />}
                </div>
              </div>
            </div>
          </div>
          {/* 보너스/패널티 */}
          <div style={{ marginBottom: 24 }}>
            <span data-label="" style={{ marginBottom: 10, display: 'block' }}>보너스 / 패널티</span>
            <div style={{ background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', overflow: 'hidden' }}>
              {RULES.map((item, idx) => (
                <div key={item.onKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < RULES.length - 1 ? '1px solid var(--kn-border)' : 'none', opacity: local[item.onKey] ? 1 : 0.45 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Toggle on={local[item.onKey]} onChange={() => set(item.onKey, !local[item.onKey])} />
                    <span style={{ fontSize: 13 }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: item.color, fontSize: 14, fontWeight: 700, width: 12, textAlign: 'center' }}>{item.sign}</span>
                    <Stepper value={local[item.valKey]} onChange={(v) => set(item.valKey, v)} disabled={!local[item.onKey]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button variant="primary" onClick={() => onSave(local)}>저장하기</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
