/**
 * AuthLayout — 로그인/회원가입 페이지 공통 레이아웃
 *
 * 사용:
 *   <AuthLayout>
 *     <LoginForm />
 *   </AuthLayout>
 */

'use client';

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0B06',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 배경 워터마크 텍스트 */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 'clamp(80px, 15vw, 200px)',
        fontWeight: 900,
        color: 'rgba(200,155,0,0.03)',
        fontFamily: "'Barlow Condensed', sans-serif",
        whiteSpace: 'nowrap',
        userSelect: 'none',
        pointerEvents: 'none',
        letterSpacing: 20,
        zIndex: 0,
      }}>
        KILL CHALLENGE
      </div>

      {/* 모서리 장식 */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 80, height: 80, borderTop: '1px solid rgba(200,155,0,0.2)', borderLeft: '1px solid rgba(200,155,0,0.2)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: 80, height: 80, borderBottom: '1px solid rgba(200,155,0,0.2)', borderRight: '1px solid rgba(200,155,0,0.2)', pointerEvents: 'none' }} />

      {/* 상단 헤더 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '22px 28px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: 10, color: 'rgba(200,155,0,0.4)', letterSpacing: 2, lineHeight: 1.8 }}>
          <div>SYSTEM STATUS: ACTIVE</div>
          <div>CONNECTION: SECURED</div>
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 26, fontWeight: 900, fontStyle: 'italic',
          color: '#F5A623', letterSpacing: 2,
        }}>
          KILL CHALLENGE
        </div>
      </div>

      {/* 중앙 카드 */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: 460,
          background: 'rgba(22,19,8,0.96)',
          border: '1px solid rgba(200,155,0,0.18)',
          borderRadius: 4,
          padding: '40px 44px',
          position: 'relative',
          animation: 'fadeIn .25s ease',
        }}>
          {/* 카드 모서리 브래킷 */}
          <div style={{ position: 'absolute', top: -1, left: -1, width: 18, height: 18, borderTop: '2px solid rgba(200,155,0,0.6)', borderLeft: '2px solid rgba(200,155,0,0.6)' }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 18, height: 18, borderBottom: '2px solid rgba(200,155,0,0.6)', borderRight: '2px solid rgba(200,155,0,0.6)' }} />
          {children}
        </div>
      </div>

      {/* 하단 푸터 */}
      <div style={{
        textAlign: 'center', padding: '18px',
        fontSize: 10, color: 'rgba(200,155,0,0.2)',
        letterSpacing: 1.5, position: 'relative', zIndex: 1,
      }}>
        © 2026 KILL CHALLENGE TERMINAL — ALL RIGHTS RESERVED
      </div>
    </div>
  );
}
