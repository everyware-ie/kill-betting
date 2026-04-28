/**
 * RoleGuideModal
 * ──────────────
 * 킬내기 서비스의 역할(방장 / 오퍼레이터) 안내 모달.
 * setup 페이지와 live 페이지 양쪽에서 공용으로 사용합니다.
 *
 * Props:
 *   onClose  () => void   — 모달 닫기 콜백
 */

'use client';

// ── 안내 항목 ──────────────────────────────────────────
const HOST_ITEMS = [
  { icon: '🏗', text: '팀 추가 · 팀 구성 관리' },
  { icon: '✏️', text: '배그 닉네임 추가 · 삭제' },
  { icon: '⚙️', text: '킬내기 룰 설정' },
  { icon: '🚀', text: '킬내기 시작' },
  { icon: '🔧', text: '점수 수동 조정' },
  { icon: '🏁', text: '경기 종료' },
];

const OP_ITEMS = [
  { icon: '👤', text: '팀 대표 유저 (팀당 1명)' },
  { icon: '📸', text: 'OCR 스크린샷 업로드' },
  { icon: '✏️', text: '매치 결과 수치 수정' },
  { icon: '🎯', text: '담당 팀 결과 관리' },
];

// ── 서브 컴포넌트: 역할 카드 ────────────────────────────
function RoleCard({ badge, badgeBg, title, subtitle, accentColor, borderColor, items }) {
  return (
    <div style={{
      background: `rgba(${accentColor}, 0.04)`,
      border: `1px solid rgba(${borderColor}, 0.28)`,
      borderRadius: 10,
      padding: '18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* 배지 + 역할명 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 11, padding: '3px 9px', borderRadius: 3,
          fontWeight: 700, background: badgeBg, color: '#1a1500',
          letterSpacing: 0.5, flexShrink: 0,
        }}>
          {badge}
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: `rgb(${accentColor})` }}>{title}</div>
          <div style={{ fontSize: 10, color: '#8A8060', marginTop: 1 }}>{subtitle}</div>
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: `rgba(${borderColor}, 0.15)` }} />

      {/* 권한 목록 */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map(({ icon, text }) => (
          <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
            <span style={{ fontSize: 12, color: '#C8B97A', lineHeight: 1.4 }}>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────
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
        background: '#1C1A0C',
        border: '1px solid rgba(200,155,0,0.28)',
        borderRadius: 12,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>

        {/* ── 모달 헤더 ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(200,155,0,0.12)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>역할 안내</div>
            <div style={{ fontSize: 11, color: '#8A8060', marginTop: 4, lineHeight: 1.5 }}>
              킬내기에서 각 역할이 무엇을 할 수 있는지 확인하세요
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#2a2810', border: '1px solid rgba(200,155,0,0.2)',
              color: '#E8DFC0', width: 28, height: 28, borderRadius: 4,
              cursor: 'pointer', fontSize: 13, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >✕</button>
        </div>

        {/* ── 역할 카드 (방장 / OP) ── */}
        <div style={{
          padding: '20px 24px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}>
          <RoleCard
            badge="👑 방장"
            badgeBg="#FFD700"
            title="방장"
            subtitle="HOST · 방 전체 관리자"
            accentColor="255,215,0"
            borderColor="255,215,0"
            items={HOST_ITEMS}
          />
          <RoleCard
            badge="★ OP"
            badgeBg="#F5A623"
            title="오퍼레이터"
            subtitle="OPERATOR · 팀당 1명"
            accentColor="245,166,35"
            borderColor="245,166,35"
            items={OP_ITEMS}
          />
        </div>

        {/* ── 방장 + OP 겸임 안내 ── */}
        <div style={{
          margin: '16px 24px',
          background: 'rgba(200,155,0,0.06)',
          border: '1px solid rgba(200,155,0,0.18)',
          borderRadius: 8,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 3, fontWeight: 700, background: '#FFD700', color: '#1a1500' }}>👑 방장</span>
            <span style={{ fontSize: 13, color: '#555' }}>+</span>
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 3, fontWeight: 700, background: '#F5A623', color: '#1a1500' }}>★ OP</span>
            <span style={{ fontSize: 11, color: '#8A8060', fontWeight: 700 }}>겸임 가능</span>
          </div>
          <div style={{ fontSize: 11, color: '#8A8060', lineHeight: 1.7 }}>
            방장이 특정 팀에 합류하면 <span style={{ color: '#C8B97A' }}>해당 팀의 OP를 겸임</span>합니다.<br />
            방장이 대기석에 있으면 방장과 OP는 <span style={{ color: '#C8B97A' }}>완전히 분리</span>됩니다.
          </div>
        </div>

        {/* ── 흐름 안내 ── */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 10 }}>진행 흐름</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
            {[
              { step: '방 생성', role: '방장', icon: '🏠' },
              { step: '팀 구성', role: '방장', icon: '🏗' },
              { step: '닉네임 등록', role: '방장', icon: '✏️' },
              { step: '킬내기 시작', role: '방장', icon: '🚀' },
              { step: 'OCR 업로드', role: 'OP', icon: '📸' },
              { step: '경기 종료', role: '방장', icon: '🏁' },
            ].map(({ step, role, icon }, idx, arr) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 36, height: 36,
                    background: role === 'OP' ? 'rgba(245,166,35,0.1)' : 'rgba(255,215,0,0.08)',
                    border: `1px solid ${role === 'OP' ? 'rgba(245,166,35,0.3)' : 'rgba(255,215,0,0.25)'}`,
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>{icon}</div>
                  <div style={{ fontSize: 9, color: '#E8DFC0', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{step}</div>
                  <div style={{
                    fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700,
                    background: role === 'OP' ? '#F5A623' : '#FFD700',
                    color: '#1a1500',
                  }}>{role === 'OP' ? '★ OP' : '👑 방장'}</div>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ width: 16, height: 1, background: 'rgba(200,155,0,0.2)', margin: '0 4px', marginBottom: 18 }} />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
