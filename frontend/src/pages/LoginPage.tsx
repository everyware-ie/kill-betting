import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      login(data.data.accessToken, {
        id: data.data.userId,
        nickname: data.data.nickname,
      } as any);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎮 킬내기</h1>
        <p style={styles.subtitle}>배틀그라운드 킬내기 플랫폼</p>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p style={styles.link}>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f1923' },
  card: { background: '#1a2634', padding: '40px', borderRadius: '12px', width: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  title: { color: '#f5a623', textAlign: 'center', marginBottom: '8px', fontSize: '28px' },
  subtitle: { color: '#8899aa', textAlign: 'center', marginBottom: '32px', fontSize: '14px' },
  input: { width: '100%', padding: '12px', marginBottom: '12px', background: '#0f1923', border: '1px solid #2a3a4a', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', background: '#f5a623', color: '#000', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: '#ff4d4d', fontSize: '13px', marginBottom: '8px' },
  link: { textAlign: 'center', color: '#8899aa', fontSize: '13px', marginTop: '16px' },
};
