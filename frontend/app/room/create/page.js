/**
 * ============================================================
 *  방 생성 페이지  /room/create
 * ============================================================
 *
 *  [2단계 플로우]
 *   Step 1. 기본 설정 — 방 제목, 게임 모드
 *   Step 2. 룰 설정   — 목표 킬, 제한 시간, 보너스/패널티
 *
 *  [완료 후 이동]
 *   방 생성 API 호출 → 성공 시 /room/:id/setup (팀 구성) 으로 이동
 *
 *  [API 호출]
 *   RoomAPI.create(title, rule, hostUserId)
 *   → lib/room-api.js 에서 실제 API 연결 방법 확인
 *
 * ============================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { useAuth }             from '@/lib/auth-context';
import { RoomAPI }             from '@/lib/room-api';
import { DEFAULT_RULE } from '@/mock/rooms';

// ─────────────────────────────────────────
//  단계 표시 바 컴포넌트
// ─────────────────────────────────────────

/** 현재 몇 단계인지 위쪽에 표시 (2단계 버전) */
function StepBar({ current }) {
  const steps = ['기본 설정', '룰 설정'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {/* 원형 번호 */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#F5A623' : active ? 'rgba(245,166,35,0.2)' : 'rgba(200,155,0,0.08)',
                border: `2px solid ${done || active ? '#F5A623' : 'rgba(200,155,0,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: done ? '#1a1500' : active ? '#F5A623' : '#555',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {/* 단계 이름 */}
              <span style={{ fontSize: 11, color: active ? '#F5A623' : done ? '#8A8060' : '#555', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {/* 단계 사이 연결선 */}
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#F5A623' : 'rgba(200,155,0,0.15)', margin: '0 8px', marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
//  Toggle 컴포넌트 (켜기/끄기 스위치)
// ─────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 42, height: 23, borderRadius: 12,
        background: on ? '#F5A623' : '#3a3820',
        cursor: 'pointer', position: 'relative',
        transition: 'background .2s',
        border: '1px solid rgba(200,155,0,0.2)', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: on ? 20 : 2,
        width: 17, height: 17, borderRadius: '50%',
        background: 'white', transition: 'left .2s',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────
//  숫자 스테퍼 컴포넌트 (−/+ 버튼)
// ─────────────────────────────────────────

function NumStepper({ value, onChange, min = 0, max = 99, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button
        disabled={disabled}
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 30, height: 34, background: '#141200', border: '1px solid rgba(200,155,0,0.25)', borderRadius: '4px 0 0 4px', color: '#F5A623', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', opacity: disabled ? 0.4 : 1 }}
      >−</button>
      <input
        type="number" value={value} disabled={disabled}
        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v))); }}
        style={{ width: 52, height: 34, background: '#141200', border: '1px solid rgba(200,155,0,0.3)', borderLeft: 'none', borderRight: 'none', color: '#F5A623', textAlign: 'center', fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit', opacity: disabled ? 0.4 : 1 }}
      />
      <button
        disabled={disabled}
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 30, height: 34, background: '#141200', border: '1px solid rgba(200,155,0,0.25)', borderRadius: '0 4px 4px 0', color: '#F5A623', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', opacity: disabled ? 0.4 : 1 }}
      >+</button>
    </div>
  );
}

// ─────────────────────────────────────────
//  메인 페이지
// ─────────────────────────────────────────

export default function CreateRoomPage() {
  const router            = useRouter();
  const { user, loading } = useAuth();

  const [step,   setStep]   = useState(0);     // 0 = 기본 설정, 1 = 룰 설정
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // ── Step 1: 기본 설정 상태 ──
  const [title, setTitle] = useState('');

  // ── Step 2: 룰 상태 ──
  const [rule, setRule] = useState({ ...DEFAULT_RULE });

  /** 룰의 특정 항목만 업데이트하는 헬퍼 */
  const setRuleField = (key, val) => setRule((r) => ({ ...r, [key]: val }));

  // ── 로그인 체크: 로그인 안 되어 있으면 로그인 페이지로 이동 ──
  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading]);

  if (loading || !user) return null;

  // ── 다음 단계로 넘어가기 전 유효성 검사 ──
  const validateStep = () => {
    if (step === 0 && !title.trim()) {
      setErrMsg('방 제목을 입력해주세요');
      return false;
    }
    setErrMsg('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(1);
  };

  // ── 방 생성 최종 제출 ──
  // TODO: API 연결 필요 — RoomAPI.create() 가 실제 서버를 바라보도록
  //       lib/api.js 의 USE_MOCK = false 로 변경 후 API_BASE_URL 설정
  const handleCreate = async () => {
    setErrMsg('');
    setSaving(true);

    // RoomAPI.create(방 제목, 룰 객체, 방장 user 객체)
    const res = await RoomAPI.create(title.trim(), rule, user);

    setSaving(false);

    if (!res.ok) {
      setErrMsg(res.error || '방 생성에 실패했습니다');
      return;
    }

    // 성공 → 팀 구성 페이지로 이동
    router.push(`/room/${res.room.id}/setup`);
  };

  // ─────────────────────────────────────────
  //  렌더
  // ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <header style={{
        background: '#1C1A0C', borderBottom: '1px solid rgba(200,155,0,0.18)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#8A8060', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← 대시보드
        </button>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, fontStyle: 'italic', color: '#F5A623', letterSpacing: 2 }}>
          새 킬내기 방 만들기
        </div>
        <div style={{ width: 80 }} />
      </header>

      {/* ── 본문 ── */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 760, width: '100%', margin: '0 auto' }}>
        <StepBar current={step} />

        {/* ════ STEP 0 — 기본 설정 ════ */}
        {step === 0 && (
          <div style={{ animation: 'fadeIn .2s ease' }}>
            <SectionTitle>방 기본 설정</SectionTitle>

            {/* 방 제목 입력 */}
            <Field label="방 제목" hint="예: 금요일 저녁 킬내기">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="방 제목을 입력하세요"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                style={inputStyle}
                autoFocus
              />
            </Field>

          </div>
        )}

        {/* ════ STEP 1 — 룰 설정 ════ */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn .2s ease' }}>
            <SectionTitle>룰 설정</SectionTitle>

            {/* 목표 킬 / 제한 시간 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <Field label="목표 킬 수">
                <NumStepper
                  value={rule.targetKills}
                  onChange={(v) => setRuleField('targetKills', v)}
                  min={1} max={999}
                />
              </Field>
              <Field label="제한 시간 (분)">
                <div>
                  <NumStepper
                    value={rule.timeLimitMin}
                    onChange={(v) => setRuleField('timeLimitMin', v)}
                    min={1} max={999}
                    disabled={rule.noTimeLimit}
                  />
                  {/* 시간 제한 없음 토글 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <Toggle on={rule.noTimeLimit} onChange={() => setRuleField('noTimeLimit', !rule.noTimeLimit)} />
                    <span style={{ fontSize: 12, color: '#8A8060' }}>시간 제한 없음</span>
                  </div>
                </div>
              </Field>
            </div>

            {/* 보너스 / 패널티 항목 목록 */}
            <SectionTitle sub>보너스 / 패널티</SectionTitle>
            <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { label: '헤드샷 보너스',  k: 'headShotBonus',   onK: 'headShotBonusOn',   sign: '+', color: '#F5A623' },
                { label: '어시스트 보너스', k: 'assistBonus',     onK: 'assistBonusOn',     sign: '+', color: '#F5A623' },
                { label: '치킨 보너스',    k: 'chickenBonus',    onK: 'chickenBonusOn',    sign: '+', color: '#F5A623' },
                { label: '팀킬 패널티',    k: 'teamKillPenalty', onK: 'teamKillPenaltyOn', sign: '-', color: '#E53935' },
                { label: '사망 패널티',    k: 'deathPenalty',    onK: 'deathPenaltyOn',    sign: '-', color: '#E53935' },
              ].map((item, i, arr) => (
                <div
                  key={item.k}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(200,155,0,0.08)' : 'none',
                    opacity: rule[item.onK] ? 1 : 0.4,
                    transition: 'opacity .2s',
                  }}
                >
                  {/* 토글 + 항목명 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Toggle on={rule[item.onK]} onChange={() => setRuleField(item.onK, !rule[item.onK])} />
                    <span style={{ fontSize: 13 }}>{item.label}</span>
                  </div>
                  {/* 부호 + 수치 스테퍼 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 15, width: 14, textAlign: 'center' }}>{item.sign}</span>
                    <NumStepper
                      value={rule[item.k]}
                      onChange={(v) => setRuleField(item.k, v)}
                      min={0} max={99}
                      disabled={!rule[item.onK]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 에러 메시지 ── */}
        {errMsg && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 4, fontSize: 12, color: '#E53935', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠ {errMsg}
          </div>
        )}

        {/* ── 하단 버튼 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(200,155,0,0.1)' }}>
          {/* 이전/취소 버튼 */}
          <button
            onClick={() => step === 0 ? router.push('/dashboard') : setStep(0)}
            style={{ background: 'transparent', border: '1px solid rgba(200,155,0,0.25)', color: '#8A8060', cursor: 'pointer', padding: '12px 24px', borderRadius: 4, fontSize: 13, fontFamily: 'inherit' }}
          >
            {step === 0 ? '취소' : '← 이전'}
          </button>

          {/* 다음/완료 버튼 */}
          {step === 0 ? (
            <button
              onClick={handleNext}
              style={{ background: '#F5A623', color: '#1a1500', border: 'none', cursor: 'pointer', padding: '12px 28px', borderRadius: 4, fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}
            >
              다음 →
            </button>
          ) : (
            // 방 생성 버튼: 누르면 API 호출 후 팀 구성 페이지로 이동
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ background: saving ? 'rgba(245,166,35,0.4)' : '#F5A623', color: '#1a1500', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', padding: '12px 28px', borderRadius: 4, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {saving ? '생성 중...' : '방 생성 후 팀 구성 →'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────
//  소형 공용 컴포넌트
// ─────────────────────────────────────────

/** 입력창 공통 스타일 */
const inputStyle = {
  width: '100%', background: '#141200',
  border: '1px solid rgba(200,155,0,0.3)',
  color: '#E8DFC0', padding: '10px 14px',
  borderRadius: 4, fontSize: 14, outline: 'none', fontFamily: 'inherit',
};

/** 섹션 제목 */
function SectionTitle({ children, sub, noMargin }) {
  return (
    <div style={{
      fontSize: sub ? 12 : 14, fontWeight: 700,
      color: sub ? '#8A8060' : '#F5A623',
      borderLeft: sub ? 'none' : '3px solid #F5A623',
      paddingLeft: sub ? 0 : 10,
      marginBottom: noMargin ? 0 : 18,
      letterSpacing: sub ? 0.5 : 1,
    }}>
      {children}
    </div>
  );
}

/** 폼 필드 (라벨 + 힌트 + 입력 요소 감싸기) */
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#C8B878', letterSpacing: 0.5 }}>{label}</span>
        {hint && <span style={{ fontSize: 10, color: '#8A8060' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
