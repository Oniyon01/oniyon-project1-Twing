import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './AuthScreen.css';

async function handleGoogleLogin() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

interface Props {
  onAuth: () => void;
  onBack: () => void;
}

type Mode = 'login' | 'signup';

const PW_RULES = [
  { label: '소문자 포함', test: (pw: string) => /[a-z]/.test(pw) },
  { label: '대문자 포함', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: '숫자 포함',   test: (pw: string) => /[0-9]/.test(pw) },
  { label: '특수문자 포함', test: (pw: string) => /[!@#$%^&*()\-_=+[\]{};':"\\|<>?,./`~]/.test(pw) },
];

export default function AuthScreen({ onAuth, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSignupDone(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오류가 발생했어요.';
      setError(translateError(msg));
    } finally {
      setLoading(false);
    }
  }

  if (signupDone) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <img src="/wingle.png" alt="윙글이" className="auth-wingle" />
          <h2 className="auth-title">이메일을 확인해주세요 📬</h2>
          <p className="auth-desc">
            <strong>{email}</strong>으로 인증 메일을 보냈어요.<br />
            확인 후 로그인해주세요!
          </p>
          <button className="auth-switch-btn" onClick={() => { setSignupDone(false); setMode('login'); }}>
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <button className="auth-back" onClick={onBack}>← 돌아가기</button>
        <img src="/wingle.png" alt="윙글이" className="auth-wingle" />
        <h2 className="auth-title">
          {mode === 'login' ? '다시 왔구나! 👋' : '윙글이와 함께해요 🪽'}
        </h2>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            회원가입
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="auth-input"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {mode === 'signup' && (
            <ul className="pw-rules">
              {PW_RULES.map((rule) => {
                const ok = password.length > 0 && rule.test(password);
                return (
                  <li key={rule.label} className={`pw-rule${ok ? ' ok' : ''}`}>
                    {ok ? '✓' : '·'} {rule.label}
                  </li>
                );
              })}
            </ul>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="auth-divider"><span>또는</span></div>

        <button className="auth-google-btn" onClick={handleGoogleLogin}>
          <svg className="auth-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (msg.includes('Email not confirmed')) return '이메일 인증이 필요해요. 메일함을 확인해주세요.';
  if (msg.includes('User already registered')) return '이미 가입된 이메일이에요.';
  if (msg.includes('Password should contain')) return '비밀번호 조건을 모두 충족해주세요.';
  if (msg.includes('Password should be')) return '비밀번호는 6자 이상이어야 해요.';
  if (msg.includes('Unable to validate email')) return '유효하지 않은 이메일이에요.';
  return msg;
}
