/**
 * ============================================================
 *  회원가입 페이지  /auth/signup
 * ============================================================
 *
 *  [화면 구성]
 *   1. 아이디 입력 + 중복 확인
 *   2. 비밀번호 입력
 *   3. 약관 동의
 *   4. 회원가입 완료 버튼
 *
 *  [참고]
 *   닉네임은 회원 정보에 없습니다.
 *   배그 닉네임은 킬내기 방 팀 구성 시 직접 입력합니다.
 *
 *  [API 호출]
 *   1. AuthAPI.checkUsername(username)  — 중복 확인
 *   2. AuthAPI.signup(username, password) — 가입 완료 → /dashboard 이동
 *
 * ============================================================
 */

'use client';

import { useState }  from 'react';
import { useRouter } from 'next/navigation';
import Link          from 'next/link';
import AuthLayout    from '@/components/layout/AuthLayout';
import Input         from '@/components/ui/Input';
import Button        from '@/components/ui/Button';
import { useAuth }   from '@/lib/auth-context';
import { AuthAPI }   from '@/lib/api';

export default function SignupPage() {
  const router     = useRouter();
  const { signup } = useAuth();

  // ── 폼 상태 ──
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [agree,    setAgree]    = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // 아이디 중복 확인 상태
  const [idCheck, setIdCheck] = useState({
    status: 'idle',   // 'idle' | 'ok' | 'error'
    message: '',
    checking: false,
  });

  // 아이디 변경 시 중복확인 초기화
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setIdCheck({ status: 'idle', message: '', checking: false });
  };

  // ── 아이디 중복 확인 ──
  const handleCheckId = async () => {
    if (!username.trim()) {
      setIdCheck({ status: 'error', message: '아이디를 입력해주세요', checking: false });
      return;
    }
    setIdCheck({ status: 'idle', message: '', checking: true });
    const res = await AuthAPI.checkUsername(username.trim());
    const available = res.data?.available;
    setIdCheck({
      status:   available ? 'ok' : 'error',
      message:  available ? '사용 가능한 아이디입니다' : (res.error || '이미 사용 중인 아이디입니다'),
      checking: false,
    });
  };

  // ── 회원가입 제출 ──
  const handleSubmit = async () => {
    setError('');
    if (idCheck.status !== 'ok') { setError('닉네임 중복 확인을 완료해주세요'); return; }
    if (!email.trim())           { setError('이메일을 입력해주세요'); return; }
    if (password.length < 8)     { setError('비밀번호는 최소 8자 이상이어야 합니다'); return; }
    if (!agree)                  { setError('이용 약관에 동의해주세요'); return; }

    setLoading(true);
    const res = await signup(username.trim(), password, email.trim());
    setLoading(false);

    if (!res.success) { setError(res.error || '회원가입에 실패했습니다'); return; }
    router.push('/dashboard');
  };

  return (
    <AuthLayout>
      {/* 제목 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: 22 }}>👤</span>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>회원가입</h2>
          <p style={{ fontSize: 12, color: '#8A8060', margin: '4px 0 0' }}>
            킬내기 방 운영을 위한 계정을 생성합니다.
          </p>
        </div>
      </div>

      {/* 아이디 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#C8B878' }}>아이디</span>
          <span style={{ fontSize: 10, color: '#8A8060' }}>영문·숫자·언더스코어 2~20자</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={username}
            onChange={handleUsernameChange}
            placeholder="예: gamer01"
            onKeyDown={(e) => e.key === 'Enter' && handleCheckId()}
            autoComplete="username"
            style={{
              flex: 1,
              background: '#1a1800',
              border: `1px solid ${
                idCheck.status === 'ok'    ? 'rgba(76,175,80,0.6)'  :
                idCheck.status === 'error' ? 'rgba(229,57,53,0.6)'  :
                'rgba(200,155,0,0.3)'
              }`,
              color: '#E8DFC0',
              padding: '9px 12px',
              borderRadius: 4,
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <Button
            variant="ghost"
            onClick={handleCheckId}
            loading={idCheck.checking}
            style={{ whiteSpace: 'nowrap', padding: '9px 14px', fontSize: 12 }}
          >
            중복 확인
          </Button>
        </div>
        {idCheck.message && (
          <div style={{
            marginTop: 6, fontSize: 12,
            color: idCheck.status === 'ok' ? '#4CAF50' : '#E53935',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {idCheck.status === 'ok' ? '✓' : '⚠'} {idCheck.message}
          </div>
        )}
      </div>

      {/* 이메일 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#C8B878' }}>이메일</span>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="예: gamer@example.com"
          autoComplete="email"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#1a1800',
            border: '1px solid rgba(200,155,0,0.3)',
            color: '#E8DFC0',
            padding: '9px 12px',
            borderRadius: 4,
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* 비밀번호 */}
      <Input
        label="비밀번호"
        hint="최소 8자리 이상"
        type={showPw ? 'text' : 'password'}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        suffix={
          <button
            onClick={() => setShowPw((s) => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#8A8060' }}
          >
            {showPw ? '🙈' : '👁'}
          </button>
        }
        style={{
          background: '#1a1800',
          borderColor: password.length > 0 && password.length < 8
            ? 'rgba(229,57,53,0.5)'
            : password.length >= 8
            ? 'rgba(76,175,80,0.4)'
            : 'rgba(200,155,0,0.3)',
        }}
        containerStyle={{ marginBottom: 16 }}
        autoComplete="new-password"
      />

      {/* 약관 동의 */}
      <div
        onClick={() => setAgree((a) => !a)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'rgba(200,155,0,0.05)',
          border: '1px solid rgba(200,155,0,0.15)',
          borderRadius: 4, padding: '12px 14px',
          marginBottom: 16, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 18, height: 18, flexShrink: 0, marginTop: 1,
          border: `2px solid ${agree ? '#F5A623' : 'rgba(200,155,0,0.35)'}`,
          borderRadius: 3,
          background: agree ? '#F5A623' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s',
        }}>
          {agree && <span style={{ color: '#1a1500', fontSize: 11, fontWeight: 900 }}>✓</span>}
        </div>
        <span style={{ fontSize: 12, color: '#8A8060', lineHeight: 1.7 }}>
          계정을 생성함으로써 서비스 약관 및 운영 정책에 동의하게 됩니다.
        </span>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          padding: '9px 12px', borderRadius: 4, marginBottom: 12,
          background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)',
          fontSize: 12, color: '#E53935', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* 가입 버튼 */}
      <Button onClick={handleSubmit} loading={loading} fullWidth size="lg">
        회원가입 완료 ›
      </Button>

      {/* 로그인 이동 */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>
        <Link href="/auth/login" style={{ color: '#8A8060', textDecoration: 'none' }}>
          이미 계정이 있으신가요? 로그인하러 가기
        </Link>
      </div>
    </AuthLayout>
  );
}
