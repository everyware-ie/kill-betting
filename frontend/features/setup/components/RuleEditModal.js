'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Toggle from './Toggle';
import Stepper from './Stepper';

const RULES = [
  { label: '헤드샷 보너스',  onKey: 'headShotBonusOn',    valKey: 'headShotBonus',   sign: '+', color: '#F5A623' },
  { label: '어시스트 보너스', onKey: 'assistBonusOn',      valKey: 'assistBonus',     sign: '+', color: '#F5A623' },
  { label: '치킨 보너스',    onKey: 'chickenBonusOn',      valKey: 'chickenBonus',    sign: '+', color: '#F5A623' },
  { label: '팀킬 패널티',    onKey: 'teamKillPenaltyOn',   valKey: 'teamKillPenalty', sign: '-', color: '#E53935' },
  { label: '사망 패널티',    onKey: 'deathPenaltyOn',      valKey: 'deathPenalty',    sign: '-', color: '#E53935' },
];

export default function RuleEditModal({ rule, onSave, onClose }) {
  const [local, setLocal] = useState({ ...rule });
  const set = (k, v) => setLocal((r) => ({ ...r, [k]: v }));

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.28)', borderRadius: 10, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(200,155,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>룰 수정</div>
            <div style={{ fontSize: 11, color: '#8A8060', marginTop: 3 }}>저장 버튼을 눌러야 실제로 반영됩니다</div>
          </div>
          <button onClick={onClose} style={{ background: '#2a2810', border: '1px solid rgba(200,155,0,0.2)', color: '#E8DFC0', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {/* 게임 모드 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#F5A623', marginBottom: 10 }}>게임 모드</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[{ mode: '솔로', icon: '👤' }, { mode: '듀오', icon: '👥' }, { mode: '스쿼드', icon: '👨‍👩‍👧‍👦' }].map(({ mode, icon }) => (
                <div key={mode} onClick={() => set('gameMode', mode)} style={{ padding: '12px 8px', textAlign: 'center', background: local.gameMode === mode ? 'rgba(245,166,35,0.12)' : '#141200', border: `1px solid ${local.gameMode === mode ? '#F5A623' : 'rgba(200,155,0,0.18)'}`, borderRadius: 6, cursor: 'pointer' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{mode}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 기본 설정 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#F5A623', marginBottom: 10 }}>기본 설정</div>
            <div style={{ background: '#141200', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid rgba(200,155,0,0.08)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>목표 킬 수</div>
                <Stepper value={local.targetKills} onChange={(v) => set('targetKills', v)} min={1} max={99} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>제한 시간 <span style={{ fontSize: 11, color: '#8A8060' }}>{local.noTimeLimit ? '(없음)' : `(${local.timeLimitMin}분)`}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle on={local.noTimeLimit} onChange={() => set('noTimeLimit', !local.noTimeLimit)} />
                    <span style={{ fontSize: 11, color: '#8A8060' }}>제한 없음</span>
                  </div>
                  {!local.noTimeLimit && <Stepper value={local.timeLimitMin} onChange={(v) => set('timeLimitMin', v)} min={10} max={300} />}
                </div>
              </div>
            </div>
          </div>
          {/* 보너스/패널티 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#F5A623', marginBottom: 10 }}>보너스 / 패널티</div>
            <div style={{ background: '#141200', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, overflow: 'hidden' }}>
              {RULES.map((item, idx) => (
                <div key={item.onKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < RULES.length - 1 ? '1px solid rgba(200,155,0,0.06)' : 'none', opacity: local[item.onKey] ? 1 : 0.45 }}>
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
            <Button onClick={() => onSave(local)}>💾 저장하기</Button>
          </div>
        </div>
      </div>
    </div>
  );
}