'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoomAPI } from '@/lib/room-api';
import { DEFAULT_RULE } from '@/mock/rooms';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';

// ── Switch ──
function KnSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!value)}
      style={{
        width: 28, height: 16, padding: 2,
        background: value ? 'var(--kn-accent)' : 'var(--kn-surface-3)',
        border: '1px solid var(--kn-border)',
        borderRadius: 999,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        transition: 'background .15s',
      }}
    >
      <span style={{
        width: 12, height: 12,
        background: value ? 'var(--kn-bg)' : 'var(--kn-text-muted)',
        borderRadius: '50%',
        transform: `translateX(${value ? 12 : 0}px)`,
        transition: 'transform .15s',
      }} />
    </button>
  );
}

// ── Stepper ──
function KnStepper({ value, onChange, min = 0, max = 999, step = 1, suffix }) {
  const dec = () => onChange?.(Math.max(min, value - step));
  const inc = () => onChange?.(Math.min(max, value + step));
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      height: 30, border: '1px solid var(--kn-border)',
      borderRadius: 'var(--kn-r-md)', overflow: 'hidden',
      background: 'var(--kn-surface-3)',
    }}>
      <button onClick={dec} style={{
        width: 28, height: 28, background: 'none', border: 'none',
        color: 'var(--kn-text-muted)', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
      }}>
        <Icon name="close" size={12} style={{ transform: 'rotate(45deg)' }} />
      </button>
      <span data-mono="" style={{
        minWidth: 48, padding: '0 8px', textAlign: 'center',
        fontSize: 13, fontWeight: 'var(--kn-w-semi)', fontVariant: 'tabular-nums',
        borderLeft: '1px solid var(--kn-border)',
        borderRight: '1px solid var(--kn-border)',
      }}>{value}{suffix}</span>
      <button onClick={inc} style={{
        width: 28, height: 28, background: 'none', border: 'none',
        color: 'var(--kn-text-muted)', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
      }}>
        <Icon name="plus" size={12} />
      </button>
    </div>
  );
}

// ── Section ──
function KnSection({ title, hint, children, style }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span data-label="">{title}</span>
          {hint && <span style={{ fontSize: 11, color: 'var(--kn-text-dim)' }}>{hint}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

// ── IconButton ──
function KnIconButton({ icon, onClick, variant = 'ghost' }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32,
        background: 'transparent',
        border: variant === 'outline' ? '1px solid var(--kn-border-strong)' : '1px solid transparent',
        color: 'var(--kn-text-muted)',
        borderRadius: 'var(--kn-r-md)',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s',
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

const PLACEHOLDER_NAMES = [
  '금요일 새벽전',
  '주말 킬내기',
  '치킨각 한판',
  '오늘은 내가 에이스',
  '30킬 먹고 자자',
];
const getPlaceholderName = () => PLACEHOLDER_NAMES[Math.floor(Math.random() * PLACEHOLDER_NAMES.length)];

const RULE_LIST = [
  { k: 'chickenBonus', onK: 'chickenBonusOn', label: '치킨 보너스', icon: 'trophy', sign: '+' },
];

const PENALTY_OPTIONS = [
  { mode: 'NONE', label: '없음' },
  { mode: 'PER_PLAYER', label: '인당 감점', valKey: 'survivalPenalty', desc: 'TOP10 실패 인당 감점' },
  { mode: 'TEAM_ONCE', label: '팀 전체 1회', valKey: 'teamSurvivalPenalty', desc: '실패자 있으면 팀 전체 1회 감점' },
];

export default function CreateRoomPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const [placeholderName] = useState(getPlaceholderName);
  const [title, setTitle] = useState('');
  const [rule, setRule] = useState({ ...DEFAULT_RULE });

  const setRuleField = (key, val) => setRule((r) => ({ ...r, [key]: val }));

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading]);

  if (loading || !user) return null;

  const handleCreate = async () => {
    setErrMsg('');
    const finalTitle = title.trim() || placeholderName;

    setSaving(true);
    const res = await RoomAPI.create(finalTitle, { ...rule }, user);
    setSaving(false);

    if (!res.success) {
      setErrMsg(res.error || '방 생성에 실패했습니다');
      return;
    }
    router.push(`/room/${res.data.roomCode}/setup`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--kn-bg)', color: 'var(--kn-text)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 28px',
        borderBottom: '1px solid var(--kn-border)',
        background: 'var(--kn-surface-1)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <KnIconButton icon="back" variant="outline" onClick={() => router.push('/dashboard')} />
        <div>
          <div data-label="" style={{ fontSize: 10 }}>NEW ROOM</div>
          <div style={{ fontSize: 17, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.01em' }}>
            방 만들기
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, overflow: 'auto', padding: '24px 28px',
        maxWidth: 720, margin: '0 auto', width: '100%',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {/* 방 정보 */}
        <KnSection title="방 정보">
          <Input
            label="방 제목"
            placeholder={placeholderName}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </KnSection>

        {/* 기본 설정 */}
        <KnSection title="기본 설정">
          <div style={{
            background: 'var(--kn-surface-1)',
            border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-lg)',
            padding: 16,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>목표 킬 수</div>
                <div style={{ fontSize: 11, color: 'var(--kn-text-dim)' }}>먼저 도달한 팀이 우승</div>
              </div>
              <KnStepper value={rule.targetKills} onChange={(v) => setRuleField('targetKills', v)} min={1} max={100} step={5} />
            </div>
            <div style={{ height: 1, background: 'var(--kn-border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>제한 시간</div>
                <div style={{ fontSize: 11, color: 'var(--kn-text-dim)' }}>
                  {rule.noTimeLimit ? '시간 제한 없이 진행' : `${rule.timeLimitMin}분 후 자동 종료`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <KnStepper value={rule.timeLimitMin} onChange={(v) => setRuleField('timeLimitMin', v)} min={10} max={360} step={10} suffix="분" />
                <KnSwitch value={!rule.noTimeLimit} onChange={(v) => setRuleField('noTimeLimit', !v)} />
              </div>
            </div>
          </div>
        </KnSection>

        {/* 보너스/패널티 */}
        <KnSection title="보너스 / 패널티" hint="원하는 룰만 켜세요">
          <div style={{
            background: 'var(--kn-surface-1)',
            border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-lg)',
            overflow: 'hidden',
          }}>
            {RULE_LIST.map((r, i) => {
              const on = rule[r.onK];
              return (
                <div key={r.k} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
                  gap: 12, alignItems: 'center',
                  padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--kn-border)',
                  opacity: on ? 1 : 0.4,
                  transition: 'opacity .15s',
                }}>
                  <Icon name={r.icon} size={18} color={r.sign === '+' ? 'var(--kn-success)' : 'var(--kn-danger)'} />
                  <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>{r.label}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--kn-font-mono)', fontSize: 12,
                    color: r.sign === '+' ? 'var(--kn-success)' : 'var(--kn-danger)',
                    fontWeight: 'var(--kn-w-semi)',
                  }}>
                    {r.sign}
                    <KnStepper
                      value={rule[r.k]}
                      onChange={(v) => setRuleField(r.k, v)}
                      min={0} max={20}
                    />
                  </div>
                  <KnSwitch value={on} onChange={(v) => setRuleField(r.onK, v)} />
                </div>
              );
            })}

            {/* 생존 패널티: 인당/팀전체 중 택일 */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--kn-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Icon name="flame" size={18} color="var(--kn-danger)" />
                <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>생존 패널티 <span style={{ fontSize: 11, color: 'var(--kn-text-dim)' }}>(방식 택일)</span></div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 30 }}>
                {PENALTY_OPTIONS.map((o) => {
                  const active = rule.penaltyMode === o.mode;
                  return (
                    <button key={o.mode} type="button" onClick={() => setRuleField('penaltyMode', o.mode)}
                      style={{ flex: 1, padding: '7px 4px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        background: active ? 'var(--kn-danger)' : 'var(--kn-surface-2)',
                        color: active ? '#fff' : 'var(--kn-text-muted)',
                        border: `1px solid ${active ? 'var(--kn-danger)' : 'var(--kn-border-strong)'}`,
                        borderRadius: 'var(--kn-r-md)' }}>
                      {o.label}
                    </button>
                  );
                })}
              </div>
              {PENALTY_OPTIONS.filter((o) => o.mode === rule.penaltyMode && o.valKey).map((o) => (
                <div key={o.valKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: 30, marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>{o.desc}</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--kn-danger)', fontWeight: 'var(--kn-w-semi)' }}>
                    <span>-</span>
                    <KnStepper value={rule[o.valKey]} onChange={(v) => setRuleField(o.valKey, v)} min={1} max={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </KnSection>

        {/* error */}
        {errMsg && (
          <div style={{
            padding: '10px 12px', borderRadius: 'var(--kn-r-md)',
            background: 'color-mix(in oklab, var(--kn-danger) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--kn-danger) 25%, transparent)',
            fontSize: 12, color: 'var(--kn-danger)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="alert" size={14} />
            {errMsg}
          </div>
        )}

        {/* CTA */}
        <div style={{
          position: 'sticky', bottom: 0,
          padding: '14px 0',
          background: 'linear-gradient(to top, var(--kn-bg) 70%, transparent)',
          display: 'flex', gap: 10,
        }}>
          <Button variant="secondary" size="lg" onClick={() => router.push('/dashboard')}>
            취소
          </Button>
          <Button
            variant="primary" size="lg" iconRight="arrow"
            style={{ flex: 1 }}
            onClick={handleCreate}
            loading={saving}
          >
            방 생성 후 팀 구성
          </Button>
        </div>
      </div>
    </div>
  );
}
