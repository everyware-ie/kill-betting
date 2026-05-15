/**
 * RoleGuideModal
 * ──────────────
 * 킬내기 서비스의 역할(방장 / 리더) 안내 모달.
 * setup 페이지와 live 페이지 양쪽에서 공용으로 사용합니다.
 */

'use client';

import Icon from '@/components/ui/Icon';

const HOST_ITEMS = [
  { icon: 'grid', text: '팀 추가 · 팀 구성 관리' },
  { icon: 'edit', text: '배그 닉네임 추가 · 삭제' },
  { icon: 'settings', text: '킬내기 룰 설정' },
  { icon: 'play', text: '킬내기 시작' },
  { icon: 'zap', text: '점수 수동 조정' },
  { icon: 'flag', text: '경기 종료' },
];

const LEADER_ITEMS = [
  { icon: 'user', text: '팀 대표 유저 (팀당 1명)' },
  { icon: 'image', text: 'OCR 스크린샷 업로드' },
  { icon: 'edit', text: '매치 결과 수치 수정' },
  { icon: 'target', text: '담당 팀 결과 관리' },
];

function RoleCard({ badge, title, subtitle, accentVar, items }) {
  return (
    <div style={{
      background: `color-mix(in oklab, ${accentVar} 5%, transparent)`,
      border: `1px solid color-mix(in oklab, ${accentVar} 28%, transparent)`,
      borderRadius: 'var(--kn-r-lg)',
      padding: '18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 11, padding: '3px 9px', borderRadius: 'var(--kn-r-sm)',
          fontWeight: 700, background: accentVar, color: 'var(--kn-bg)',
          letterSpacing: 0.5, flexShrink: 0,
        }}>
          {badge}
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: accentVar }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', marginTop: 1 }}>{subtitle}</div>
        </div>
      </div>

      <div style={{ height: 1, background: `color-mix(in oklab, ${accentVar} 15%, transparent)` }} />

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map(({ icon, text }) => (
          <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icon name={icon} size={14} color={accentVar} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--kn-text)', lineHeight: 1.4 }}>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RoleGuideModal({ onClose }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
        padding: 20,
      }}
    >
      <div style={{
        background: 'var(--kn-surface-1)',
        border: '1px solid var(--kn-border)',
        borderRadius: 'var(--kn-r-xl)',
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>

        {/* 모달 헤더 */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--kn-border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'var(--kn-w-bold)', letterSpacing: 0.5 }}>역할 안내</div>
            <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
              킬내기에서 각 역할이 무엇을 할 수 있는지 확인하세요
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)',
              color: 'var(--kn-text)', width: 28, height: 28, borderRadius: 'var(--kn-r-md)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        {/* 역할 카드 */}
        <div style={{
          padding: '20px 24px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}>
          <RoleCard
            badge="방장"
            title="방장"
            subtitle="HOST · 방 전체 관리자"
            accentVar="var(--kn-accent)"
            items={HOST_ITEMS}
          />
          <RoleCard
            badge="LEADER"
            title="리더"
            subtitle="LEADER · 팀당 1명"
            accentVar="var(--kn-success)"
            items={LEADER_ITEMS}
          />
        </div>

        {/* 방장 + 리더 겸임 안내 */}
        <div style={{
          margin: '16px 24px',
          background: 'var(--kn-surface-2)',
          border: '1px solid var(--kn-border)',
          borderRadius: 'var(--kn-r-lg)',
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 'var(--kn-r-sm)', fontWeight: 700, background: 'var(--kn-accent)', color: 'var(--kn-bg)' }}>방장</span>
            <span style={{ fontSize: 13, color: 'var(--kn-text-dim)' }}>+</span>
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 'var(--kn-r-sm)', fontWeight: 700, background: 'var(--kn-success)', color: 'var(--kn-bg)' }}>LEADER</span>
            <span style={{ fontSize: 11, color: 'var(--kn-text-muted)', fontWeight: 700 }}>겸임 가능</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', lineHeight: 1.7 }}>
            방장이 특정 팀에 합류하면 <span style={{ color: 'var(--kn-text)' }}>해당 팀의 리더를 겸임</span>합니다.<br />
            방장이 대기석에 있으면 방장과 리더는 <span style={{ color: 'var(--kn-text)' }}>완전히 분리</span>됩니다.
          </div>
        </div>

        {/* 흐름 안내 */}
        <div style={{ padding: '0 24px 20px' }}>
          <span data-label="" style={{ marginBottom: 10, display: 'block' }}>진행 흐름</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
            {[
              { step: '방 생성', icon: 'grid', isLeader: false },
              { step: '팀 구성', icon: 'users', isLeader: false },
              { step: '닉네임 등록', icon: 'edit', isLeader: false },
              { step: '킬내기 시작', icon: 'play', isLeader: false },
              { step: 'OCR 업로드', icon: 'image', isLeader: true },
              { step: '경기 종료', icon: 'flag', isLeader: false },
            ].map(({ step, icon, isLeader }, idx, arr) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 36, height: 36,
                    background: isLeader
                      ? 'color-mix(in oklab, var(--kn-success) 10%, transparent)'
                      : 'var(--kn-accent-bg)',
                    border: `1px solid ${isLeader ? 'color-mix(in oklab, var(--kn-success) 30%, transparent)' : 'color-mix(in oklab, var(--kn-accent) 25%, transparent)'}`,
                    borderRadius: 'var(--kn-r-lg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={icon} size={16} color={isLeader ? 'var(--kn-success)' : 'var(--kn-accent)'} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--kn-text)', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{step}</div>
                  <div style={{
                    fontSize: 8, padding: '1px 5px', borderRadius: 'var(--kn-r-sm)', fontWeight: 700,
                    background: isLeader ? 'var(--kn-success)' : 'var(--kn-accent)',
                    color: 'var(--kn-bg)',
                  }}>{isLeader ? 'LEADER' : '방장'}</div>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ width: 16, height: 1, background: 'var(--kn-border)', margin: '0 4px', marginBottom: 18 }} />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
