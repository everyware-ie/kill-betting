'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ToggleMini from './ToggleMini';

const rBtnStyle = {
  width: 26, height: 28,
  background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)',
  color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 700,
  fontFamily: 'inherit', borderRadius: 'var(--kn-r-sm)',
};

function RuleRow({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--kn-border)', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function RuleBonusRow({ label, on, onToggle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--kn-border)', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <ToggleMini on={on} onChange={onToggle} />
        <span style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)', color: on ? 'var(--kn-text)' : 'var(--kn-text-dim)' }}>{label}</span>
      </div>
      <div style={{ flexShrink: 0, opacity: on ? 1 : 0.3, pointerEvents: on ? 'auto' : 'none' }}>{children}</div>
    </div>
  );
}

function NumberStepper({ val, min = 0, max = 99, onChange, color = 'var(--kn-accent)', disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button onClick={() => onChange(Math.max(min, val - 1))} disabled={disabled}
        style={{ ...rBtnStyle, borderRadius: 'var(--kn-r-sm) 0 0 var(--kn-r-sm)' }}>−</button>
      <span style={{ width: 36, textAlign: 'center', lineHeight: '26px', background: 'var(--kn-surface-3)', borderTop: '1px solid var(--kn-border-strong)', borderBottom: '1px solid var(--kn-border-strong)', fontWeight: 700, color, fontSize: 15, fontFamily: 'var(--kn-font-mono)' }}>{val}</span>
      <button onClick={() => onChange(Math.min(max, val + 1))} disabled={disabled}
        style={{ ...rBtnStyle, borderRadius: '0 var(--kn-r-sm) var(--kn-r-sm) 0' }}>+</button>
    </div>
  );
}

export default function AdminModal({ room, onAdjust, onEnd, onRuleUpdate, onClose }) {
  const [view, setView] = useState('menu');
  const [adjTeamId, setAdjTeamId] = useState(room.teams[0]?.id || '');
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjSign, setAdjSign] = useState('+');
  const [adjReason, setAdjReason] = useState('');
  const [endConfirm, setEndConfirm] = useState('');
  const [rule, setRule] = useState({ ...room.rule });
  const [ruleSaving, setRuleSaving] = useState(false);

  const setR = (key, val) => setRule((prev) => ({ ...prev, [key]: val }));
  const handleRuleSave = async () => { setRuleSaving(true); await onRuleUpdate(rule); setRuleSaving(false); onClose(); };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'var(--kn-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}
    >
      <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-xl)', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--kn-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="settings" size={18} /> 운영 메뉴
          </div>
          <button onClick={onClose} style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', width: 28, height: 28, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          {view === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { v: 'adjust', icon: 'zap', title: '점수 조정', desc: '팀 점수를 수동으로 가감합니다' },
                { v: 'rule', icon: 'settings', title: '룰 변경', desc: '목표 킬, 보너스/패널티 등 규칙을 수정합니다' },
                { v: 'end', icon: 'flag', title: '경기 종료', desc: '킬내기를 즉시 종료하고 결과를 확정합니다', danger: true },
              ].map((item) => (
                <div key={item.v} onClick={() => setView(item.v)} style={{ padding: '14px 16px', background: 'var(--kn-surface-2)', border: `1px solid ${item.danger ? 'color-mix(in oklab, var(--kn-danger) 30%, transparent)' : 'var(--kn-border)'}`, borderRadius: 'var(--kn-r-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name={item.icon} size={20} color={item.danger ? 'var(--kn-danger)' : 'var(--kn-text-muted)'} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: item.danger ? 'var(--kn-danger)' : 'var(--kn-text)' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'adjust' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="back" size={14} /> 메뉴로
              </button>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>대상 팀</div>
                <select value={adjTeamId} onChange={(e) => setAdjTeamId(e.target.value)}
                  style={{ width: '100%', background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', padding: '9px 12px', borderRadius: 'var(--kn-r-md)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                  {room.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>조정 방향</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['+', '-'].map((s) => (
                      <div key={s} onClick={() => setAdjSign(s)} style={{ flex: 1, padding: '9px', textAlign: 'center', border: `1px solid ${adjSign === s ? (s === '+' ? 'var(--kn-success)' : 'var(--kn-danger)') : 'var(--kn-border)'}`, background: adjSign === s ? (s === '+' ? 'color-mix(in oklab, var(--kn-success) 10%, transparent)' : 'color-mix(in oklab, var(--kn-danger) 10%, transparent)') : 'var(--kn-surface-3)', borderRadius: 'var(--kn-r-md)', cursor: 'pointer', fontWeight: 700, fontSize: 16, color: adjSign === s ? (s === '+' ? 'var(--kn-success)' : 'var(--kn-danger)') : 'var(--kn-text-muted)' }}>{s}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>조정 수치</div>
                  <input type="number" min={1} value={adjAmount} onChange={(e) => setAdjAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '100%', background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-accent)', padding: '9px 12px', borderRadius: 'var(--kn-r-md)', fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'var(--kn-font-mono)', textAlign: 'center' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>사유 (필수)</div>
                <input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="예: 서버 오류로 인한 보상"
                  style={{ width: '100%', background: 'var(--kn-surface-3)', border: `1px solid ${adjReason.trim() ? 'var(--kn-border-strong)' : 'color-mix(in oklab, var(--kn-danger) 40%, transparent)'}`, color: 'var(--kn-text)', padding: '9px 12px', borderRadius: 'var(--kn-r-md)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                {!adjReason.trim() && <div style={{ fontSize: 11, color: 'var(--kn-danger)', marginTop: 4 }}>사유를 입력해야 반영할 수 있습니다</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button variant="primary" disabled={!adjReason.trim()} onClick={() => { onAdjust(adjTeamId, adjSign === '+' ? adjAmount : -adjAmount, adjReason); onClose(); }}>반영하기</Button>
              </div>
            </div>
          )}

          {view === 'rule' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="back" size={14} /> 메뉴로
              </button>
              <RuleRow label="목표 킬 수" desc="이 킬 수에 도달하면 종료 안내가 표시됩니다">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setR('targetKills', Math.max(1, rule.targetKills - 1))} style={rBtnStyle}>−</button>
                  <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 18, color: 'var(--kn-accent)', fontFamily: 'var(--kn-font-mono)' }}>{rule.targetKills}</span>
                  <button onClick={() => setR('targetKills', rule.targetKills + 1)} style={rBtnStyle}>+</button>
                </div>
              </RuleRow>
              <RuleRow label="제한 시간" desc={rule.noTimeLimit ? '시간 제한 없음' : `${rule.timeLimitMin}분`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>제한없음</span>
                  <ToggleMini on={rule.noTimeLimit} onChange={() => setR('noTimeLimit', !rule.noTimeLimit)} />
                  {!rule.noTimeLimit && (
                    <>
                      <button onClick={() => setR('timeLimitMin', Math.max(10, rule.timeLimitMin - 10))} style={rBtnStyle}>−</button>
                      <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 16, color: 'var(--kn-text)', fontFamily: 'var(--kn-font-mono)' }}>{rule.timeLimitMin}</span>
                      <button onClick={() => setR('timeLimitMin', Math.min(480, rule.timeLimitMin + 10))} style={rBtnStyle}>+</button>
                      <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>분</span>
                    </>
                  )}
                </div>
              </RuleRow>
              <div style={{ borderTop: '1px solid var(--kn-border)', margin: '12px 0' }} />
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>보너스</span>
              <RuleBonusRow label="치킨 보너스" on={rule.chickenBonusOn} onToggle={() => setR('chickenBonusOn', !rule.chickenBonusOn)}>
                <NumberStepper val={rule.chickenBonus} min={1} disabled={!rule.chickenBonusOn} onChange={(v) => setR('chickenBonus', v)} />
              </RuleBonusRow>
              <div style={{ borderTop: '1px solid var(--kn-border)', margin: '12px 0' }} />
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>패널티</span>
              <RuleBonusRow label="조기사망 패널티" on={rule.survivalPenaltyOn} onToggle={() => setR('survivalPenaltyOn', !rule.survivalPenaltyOn)}>
                <NumberStepper val={rule.survivalPenalty} min={1} disabled={!rule.survivalPenaltyOn} onChange={(v) => setR('survivalPenalty', v)} color="var(--kn-danger)" />
              </RuleBonusRow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 18 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button variant="primary" onClick={handleRuleSave} loading={ruleSaving} icon="check">저장하기</Button>
              </div>
            </div>
          )}

          {view === 'end' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="back" size={14} /> 메뉴로
              </button>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Icon name="alert" size={32} color="var(--kn-danger)" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)', marginBottom: 6 }}>정말 종료하시겠습니까?</div>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', lineHeight: 1.7 }}>종료 시 결과가 확정되고<br />라이브 스코어보드가 닫힙니다.</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', textAlign: 'center', marginBottom: 6 }}>"종료" 를 입력하세요</div>
                <input value={endConfirm} onChange={(e) => setEndConfirm(e.target.value)} placeholder="종료"
                  style={{ width: '100%', textAlign: 'center', background: 'var(--kn-surface-3)', border: `1px solid color-mix(in oklab, var(--kn-danger) 40%, transparent)`, color: 'var(--kn-text)', padding: '10px', borderRadius: 'var(--kn-r-md)', fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button variant="danger" disabled={endConfirm !== '종료'} onClick={() => { onEnd(); onClose(); }}>종료하기</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
