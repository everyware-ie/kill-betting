'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();

  // 이미 로그인된 경우 (자동로그인 등) 대시보드로 이동
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading]);

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem('remember_me') === 'true'; } catch { return false; }
  });
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRememberChange = (checked) => {
    setRememberMe(checked);
    try { localStorage.setItem('remember_me', String(checked)); } catch {}
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('아이디를 입력해주세요'); return; }
    if (!password) { setError('비밀번호를 입력해주세요'); return; }

    setSubmitting(true);
    const res = await login(email.trim(), password, rememberMe);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || '로그인에 실패했습니다');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <AuthLayout>
      {/* heading */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.02em' }}>
          돌아오신 걸 환영합니다
        </div>
        <div style={{ fontSize: 13, color: 'var(--kn-text-muted)', marginTop: 4 }}>
          아이디로 로그인하고 방을 만들거나 참여하세요.
        </div>
      </div>

      {/* form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          label="이메일"
          placeholder="이메일"
          prefix="user"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoComplete="email"
        />
        <Input
          label="비밀번호"
          placeholder="••••••"
          prefix="lock"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          suffix={
            <button
              onClick={() => setShowPw((s) => !s)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: 'var(--kn-text-muted)', display: 'flex',
              }}
            >
              <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
            </button>
          }
          autoComplete="current-password"
        />
      </div>

      {/* 자동로그인 체크박스 */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', userSelect: 'none',
        fontSize: 13, color: 'var(--kn-text-muted)',
      }}>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => handleRememberChange(e.target.checked)}
          style={{
            width: 16, height: 16, cursor: 'pointer',
            accentColor: 'var(--kn-accent)',
          }}
        />
        자동로그인
      </label>

      {/* error */}
      {error && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--kn-r-md)',
          background: 'color-mix(in oklab, var(--kn-danger) 12%, transparent)',
          border: '1px solid color-mix(in oklab, var(--kn-danger) 25%, transparent)',
          fontSize: 12, color: 'var(--kn-danger)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="alert" size={14} />
          {error}
        </div>
      )}

      {/* actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={submitting}>
          로그인
        </Button>
        <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
          <Button variant="outline" size="lg" fullWidth>
            회원가입
          </Button>
        </Link>
      </div>

      {/* mock info */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{
          marginTop: 4,
          padding: 12,
          background: 'var(--kn-accent-bg)',
          border: '1px dashed color-mix(in oklab, var(--kn-accent) 30%, transparent)',
          borderRadius: 'var(--kn-r-md)',
          fontSize: 11, lineHeight: 1.7,
          color: 'var(--kn-text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Icon name="info" size={13} color="var(--kn-accent)" />
            <span style={{ color: 'var(--kn-accent)', fontWeight: 'var(--kn-w-semi)' }}>Mock 모드</span>
          </div>
          테스트 계정 · <span data-mono="" style={{ color: 'var(--kn-text)' }}>test</span> / <span data-mono="" style={{ color: 'var(--kn-text)' }}>1234</span>
        </div>
      )}
    </AuthLayout>
  );
}
