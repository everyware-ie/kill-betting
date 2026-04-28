/**
 * ============================================================
 *  자동 입장 페이지  /join/:code
 * ============================================================
 *
 *  [역할]
 *   공유 URL(예: https://도메인/join/abc123)을 클릭하면
 *   자동으로 해당 방에 입장하고 팀 구성 화면으로 이동합니다.
 *
 *  [흐름]
 *   1. URL에서 code 파라미터 읽기
 *   2. 로그인 여부 확인 → 미로그인이면 /auth/login?redirect=/join/:code 로 이동
 *   3. RoomAPI.joinByCode(code, user) 호출
 *   4. 성공 → /room/:id/setup 으로 이동
 *   5. 실패 → 에러 메시지 표시 + 대시보드 이동 버튼
 *
 * ============================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth }  from '@/lib/auth-context';
import { RoomAPI }  from '@/lib/room-api';

export default function JoinByCodePage() {
  const router      = useRouter();
  const { code }    = useParams();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState('loading'); // 'loading' | 'joining' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return; // 인증 상태 확인 대기

    // 미로그인 → 로그인 페이지로 리다이렉트 (로그인 후 다시 이 페이지로)
    if (!user) {
      router.replace(`/auth/login?redirect=/join/${code}`);
      return;
    }

    // 자동 입장 시도
    const doJoin = async () => {
      setStatus('joining');
      const res = await RoomAPI.joinByCode(code, user);
      if (res.ok) {
        router.replace(`/room/${res.roomId}/setup`);
      } else {
        setStatus('error');
        setErrorMsg(res.error || '방 입장에 실패했습니다');
      }
    };

    doJoin();
  }, [authLoading, user, code, router]);

  // ── 공통 레이아웃 스타일 ──
  const containerStyle = {
    minHeight: '100vh',
    background: '#12100A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  };

  // ── 로딩 / 입장 중 ──
  if (status === 'loading' || status === 'joining') {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: 36 }}>⚔️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#E8DFC0' }}>
          {status === 'loading' ? '인증 확인 중...' : '방 입장 중...'}
        </div>
        <div style={{ fontSize: 12, color: '#8A8060' }}>
          초대 코드: <span style={{ color: '#F5A623', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>{code}</span>
        </div>
        {/* 로딩 점 애니메이션 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#F5A623', opacity: 0.3,
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ── 에러 ──
  return (
    <div style={containerStyle}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#E53935' }}>입장 실패</div>
      <div style={{
        padding: '12px 20px',
        background: 'rgba(229,57,53,0.1)',
        border: '1px solid rgba(229,57,53,0.3)',
        borderRadius: 6,
        fontSize: 13, color: '#E53935',
        textAlign: 'center', maxWidth: 340,
      }}>
        {errorMsg}
      </div>
      <div style={{ fontSize: 11, color: '#8A8060' }}>
        초대 코드: <span style={{ color: '#F5A623', fontFamily: "'Share Tech Mono', monospace" }}>{code}</span>
      </div>
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          marginTop: 8,
          background: 'rgba(200,155,0,0.1)',
          border: '1px solid rgba(200,155,0,0.3)',
          color: '#F5A623',
          padding: '10px 24px',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit',
        }}
      >
        대시보드로 돌아가기
      </button>
    </div>
  );
}
