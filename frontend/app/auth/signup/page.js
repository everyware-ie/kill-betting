'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth-context';
import { AuthAPI } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [idCheck, setIdCheck] = useState({
    status: 'idle',
    message: '',
    checking: false,
  });

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setIdCheck({ status: 'idle', message: '', checking: false });
  };

  const handleCheckId = async () => {
    if (!username.trim()) {
      setIdCheck({ status: 'error', message: '아이디를 입력해주세요', checking: false });
      return;
    }
    setIdCheck({ status: 'idle', message: '', checking: true });
    const res = await AuthAPI.checkUsername(username.trim());
    const available = res.data?.available;
    setIdCheck({
      status: available ? 'ok' : 'error',
      message: available ? '사용 가능한 아이디입니다' : (res.error || '이미 사용 중인 아이디입니다'),
      checking: false,
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (idCheck.status !== 'ok') { setError('아이디 중복 확인을 완료해주세요'); return; }
    if (!email.trim()) { setError('이메일을 입력해주세요'); return; }
    if (password.length < 8) { setError('비밀번호는 최소 8자 이상이어야 합니다'); return; }
    if (!agree) { setError('이용 약관에 동의해주세요'); return; }

    setLoading(true);
    const res = await signup(username.trim(), password, email.trim());
    setLoading(false);

    if (!res.success) { setError(res.error || '회원가입에 실패했습니다'); return; }
    router.push('/dashboard');
  };

  return (
    <AuthLayout>
      {/* heading */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.02em' }}>
          새 계정 만들기
        </div>
        <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginTop: 4, lineHeight: 1.6 }}>
          배그 닉네임은 입력하지 않습니다. 방마다 직접 입력하세요.
        </div>
      </div>

      {/* form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* username with check */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span data-label="">아이디</span>
            <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>영문·숫자 2~20자</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={username}
              onChange={handleUsernameChange}
              placeholder="아이디"
              onKeyDown={(e) => e.key === 'Enter' && handleCheckId()}
              autoComplete="username"
              style={{
                flex: 1, height: 'var(--kn-ctrl-h)', padding: '0 12px',
                background: 'var(--kn-surface-3)',
                border: '1px solid ' + (
                  idCheck.status === 'ok' ? 'var(--kn-success)' :
                  idCheck.status === 'error' ? 'var(--kn-danger)' :
                  'var(--kn-border-strong)'
                ),
                color: 'var(--kn-text)',
                borderRadius: 'var(--kn-r-md)',
                fontFamily: 'var(--kn-font-mono)', fontSize: 13,
                outline: 'none',
              }}
            />
            <Button variant="secondary" onClick={handleCheckId} loading={idCheck.checking}>
              중복확인
            </Button>
          </div>
          {idCheck.message && (
            <div style={{
              marginTop: 6, fontSize: 12,
              color: idCheck.status === 'ok' ? 'var(--kn-success)' : 'var(--kn-danger)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name={idCheck.status === 'ok' ? 'check' : 'alert'} size={13} />
              {idCheck.message}
            </div>
          )}
        </div>

        {/* email */}
        <Input
          label="이메일"
          type="email"
          placeholder="예: gamer@example.com"
          prefix="mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {/* password */}
        <Input
          label="비밀번호"
          hint="최소 8자"
          type={showPw ? 'text' : 'password'}
          placeholder="••••••••"
          prefix="lock"
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
          autoComplete="new-password"
        />
      </div>

      {/* agreement */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: 'var(--kn-text-muted)',
        cursor: 'pointer',
      }}>
        <span
          onClick={() => setAgree((a) => !a)}
          style={{
            width: 16, height: 16,
            background: agree ? 'var(--kn-accent)' : 'var(--kn-surface-3)',
            border: '1px solid ' + (agree ? 'var(--kn-accent)' : 'var(--kn-border-strong)'),
            borderRadius: 'var(--kn-r-sm)',
            display: 'inline-grid', placeItems: 'center',
            transition: 'background .15s',
            flexShrink: 0,
          }}
        >
          {agree && <Icon name="check" size={12} color="var(--kn-bg)" strokeWidth={2.5} />}
        </span>
        <span onClick={() => setAgree((a) => !a)}>
          이용약관 및 개인정보 처리방침에 동의합니다.
        </span>
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

      {/* submit */}
      <Button
        variant="primary" size="lg" fullWidth iconRight="arrow"
        onClick={handleSubmit} loading={loading}
        disabled={!agree || idCheck.status !== 'ok'}
      >
        회원가입 완료
      </Button>

      {/* login link */}
      <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', textAlign: 'center' }}>
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/login" style={{ color: 'var(--kn-accent)', textDecoration: 'none' }}>
          로그인
        </Link>
      </div>
    </AuthLayout>
  );
}