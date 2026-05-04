/**
 * ============================================================
 *  로그인 페이지  /auth/login
 * ============================================================
 *
 *  [화면 구성]
 *   - 아이디 입력
 *   - 비밀번호 입력
 *   - 로그인 버튼
 *   - 회원가입 이동 링크
 *
 *  [API 호출]
 *   AuthAPI.login(username, password)
 *   → 성공: /dashboard 로 이동
 *   → 실패: 에러 메시지 표시
 *
 *  [Mock 계정]
 *   아이디: test  /  비밀번호: 1234
 *
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { useRouter }  from 'next/navigation';
import Link           from 'next/link';
import AuthLayout     from '@/components/layout/AuthLayout';
import Input          from '@/components/ui/Input';
import Button         from '@/components/ui/Button';
import { useAuth }    from '@/lib/auth-context';

export default function LoginPage() {
  const router        = useRouter();
  const { login }     = useAuth();

  // ── 폼 상태 ──
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── 로그인 제출 ──
  const handleSubmit = async () => {
    setError('');

    // 클라이언트 유효성 검사
    if (!email.trim())   { setError('이메일을 입력해주세요'); return; }
    if (!password)       { setError('비밀번호를 입력해주세요'); return; }

    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || '로그인에 실패했습니다');
      return;
    }

    // 로그인 성공 → 대시보드로 이동
    router.push('/dashboard');
  };

  return (
    <AuthLayout>
      {/* 제목 영역 */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-block',
          background: '#F5A623', color: '#1a1500',
          fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
          padding: '4px 14px', marginBottom: 16, borderRadius: 2,
        }}>
          ACCESS GRANTED
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, margin: '0 0 8px' }}>
          킬내기 로그인
        </h1>
        <p style={{ fontSize: 13, color: '#8A8060', margin: 0 }}>
          전장으로 복귀하기 위해 신원을 확인하십시오.
        </p>
      </div>

      {/* 이메일 입력 */}
      <Input
        type="email"
        label="이메일"
        placeholder="이메일을 입력하세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        prefix="✉️"
        style={{ background: '#1a1800' }}
        containerStyle={{ marginBottom: 14 }}
        autoComplete="email"
      />

      {/* 비밀번호 입력 */}
      <Input
        label="비밀번호"
        type={showPw ? 'text' : 'password'}
        placeholder="암호 코드를 입력하세요"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        prefix="🔒"
        suffix={
          <button
            onClick={() => setShowPw((s) => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#8A8060' }}
          >
            {showPw ? '🙈' : '👁'}
          </button>
        }
        style={{ background: '#1a1800' }}
        containerStyle={{ marginBottom: 8 }}
        autoComplete="current-password"
      />

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          padding: '9px 12px', borderRadius: 4, marginBottom: 8,
          background: 'rgba(229,57,53,0.1)',
          border: '1px solid rgba(229,57,53,0.3)',
          fontSize: 12, color: '#E53935',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* 로그인 버튼 */}
      <Button
        onClick={handleSubmit}
        loading={loading}
        fullWidth
        size="lg"
        style={{ marginTop: 16, letterSpacing: 1 }}
      >
        로그인
      </Button>

      {/* 회원가입 이동 */}
      <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          style={{ marginTop: 10 }}
        >
          회원가입
        </Button>
      </Link>

      {/* Mock 안내 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{
          marginTop: 20, padding: '10px 12px',
          background: 'rgba(200,155,0,0.06)',
          border: '1px dashed rgba(200,155,0,0.2)',
          borderRadius: 4, fontSize: 11, color: '#8A8060', lineHeight: 1.8,
        }}>
          🔧 <b style={{ color: '#F5A623' }}>Mock 모드</b> — 테스트 계정으로 로그인<br />
          아이디: <b style={{ color: '#E8DFC0' }}>test</b> &nbsp;/&nbsp;
          비밀번호: <b style={{ color: '#E8DFC0' }}>1234</b>
        </div>
      )}
    </AuthLayout>
  );
}
