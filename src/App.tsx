import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import IntroScreen from './components/IntroScreen';
import AuthScreen from './components/AuthScreen';
import CategoryRanking from './components/CategoryRanking';
import ChallengeBoard from './components/ChallengeBoard';
import WinglePick from './components/WinglePick';
import TrendDetail from './components/TrendDetail';
import Feed from './components/Feed';
import MyPage from './components/MyPage';
import IdeaInputScreen from './components/IdeaInputScreen';
import VariantsScreen from './components/VariantsScreen';
import UnlockScreen from './components/UnlockScreen';
import DevPanel from './components/DevPanel';
import { supabase } from './lib/supabase';
import { fetchTrends, rowToTrend } from './lib/trends';
import type { TrendRow } from './lib/trends';
import { generateVariants, deepAnalysis } from './lib/workers';
import { MOCK_IDEA_INPUT, MOCK_VARIANTS, MOCK_DEEP_ANALYSIS } from './data/mockIdea';
import type { Trend, IdeaInput, VariantsResult, DeepAnalysis } from './types';
import './styles.css';

type Session = 'intro' | 'feed' | 'auth' | 'mypage' | 'idea-input' | 'idea-variants' | 'idea-unlock';
type FeedTab = 'home' | 'winglepick' | 'challenge' | 'ranking';

export default function App() {
  const [session, setSession] = useState<Session>('intro');
  const [feedTab, setFeedTab] = useState<FeedTab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState(false);
  const [detailTrend, setDetailTrend] = useState<Trend | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('tw-theme') !== 'light';
  });
  const [devUserOverride, setDevUserOverride] = useState<string | undefined>(undefined);
  const [devErrorOverride, setDevErrorOverride] = useState(false);
  const [devNewUserMode, setDevNewUserMode] = useState(false);
  const [devOnboarded, setDevOnboarded] = useState(false);

  // ── 아이디어 창작 플로우 상태 ──
  const [ideaInput, setIdeaInput] = useState<IdeaInput | null>(null);
  const [variantsResult, setVariantsResult] = useState<VariantsResult | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<DeepAnalysis | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('tw-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setUser(s?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadTrends() {
    setTrendsLoading(true);
    setTrendsError(false);
    try {
      const data = await fetchTrends();
      setTrends(data);
    } catch {
      setTrendsError(true);
    } finally {
      setTrendsLoading(false);
    }
  }

  useEffect(() => {
    loadTrends();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('trends-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trends' }, (payload) => {
        const row = payload.new as TrendRow;
        setTrends((prev) =>
          prev.map((t) =>
            t.id === row.id
              ? { ...t, votes: { yes: row.votes_yes, no: row.votes_no, maybe: row.votes_maybe } }
              : t
          )
        );
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trends' }, (payload) => {
        setTrends((prev) => [rowToTrend(payload.new as TrendRow), ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function handleLoginRequired() {
    setSession('auth');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession('intro');
  }

  function handleMyPageTab() {
    if (user) {
      setSession('mypage');
    } else {
      setSession('auth');
    }
  }

  function handleStartIdeaCreation() {
    if (!user) {
      setSession('auth');
      return;
    }
    setIdeaInput(null);
    setVariantsResult(null);
    setSelectedVariantIndex(null);
    setDeepAnalysisResult(null);
    setSession('idea-input');
  }

  function handleIdeaDemo() {
    setIdeaInput(MOCK_IDEA_INPUT);
    setVariantsResult(MOCK_VARIANTS);
    setSelectedVariantIndex(null);
    setDeepAnalysisResult(null);
    localStorage.setItem('twing_onboarded', '1');
    setSession('idea-variants');
  }

  async function handleIdeaSubmit(input: IdeaInput): Promise<void> {
    if (!user) throw new Error('로그인이 필요해');
    const result = await generateVariants(user.id, input);
    setIdeaInput(input);
    setVariantsResult(result);
    localStorage.setItem('twing_onboarded', '1');
    setSession('idea-variants');
  }

  async function handleVariantSelect(variantIndex: number): Promise<void> {
    if (!variantsResult) throw new Error('아이디어 정보가 없어');
    // 데모 모드: mock idea_id면 mock 분석 결과 사용
    if (variantsResult.idea_id === 'demo-idea-id') {
      setSelectedVariantIndex(variantIndex);
      setDeepAnalysisResult(MOCK_DEEP_ANALYSIS);
      setSession('idea-unlock');
      return;
    }
    const result = await deepAnalysis(variantsResult.idea_id, variantIndex);
    setSelectedVariantIndex(variantIndex);
    setDeepAnalysisResult(result);
    setSession('idea-unlock');
  }

  // ── 아이디어 창작 화면들 ──
  if (session === 'idea-input') {
    return (
      <IdeaInputScreen
        onSubmit={handleIdeaSubmit}
        onDemo={handleIdeaDemo}
        onBack={() => setSession('feed')}
      />
    );
  }

  if (session === 'idea-variants' && variantsResult && ideaInput) {
    return (
      <VariantsScreen
        variantsResult={variantsResult}
        ideaInput={ideaInput}
        onSelect={handleVariantSelect}
        onBack={() => setSession('idea-input')}
      />
    );
  }

  if (session === 'idea-unlock' && deepAnalysisResult && variantsResult && ideaInput && selectedVariantIndex !== null) {
    return (
      <UnlockScreen
        deepAnalysis={deepAnalysisResult}
        variant={variantsResult.variants[selectedVariantIndex]}
        ideaInput={ideaInput}
        onBack={() => setSession('feed')}
      />
    );
  }

  if (session === 'intro') {
    return <IntroScreen onNext={() => setSession('feed')} />;
  }

  if (session === 'auth') {
    return (
      <AuthScreen
        onAuth={() => setSession('feed')}
        onBack={() => setSession('feed')}
      />
    );
  }

  if (session === 'mypage' && user) {
    return (
      <MyPage
        user={user}
        onBack={() => setSession('feed')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo-wrap">
          <img src="/wingle.png" alt="윙글이" className="header-wingle" />
          <div className="header-brand">
            <span className="logo">Twing</span>
            <span className="slogan">유행을 직접 만들어봐</span>
          </div>
        </div>
        <div className="header-right">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {user ? (
            <div className="user-info">
              <button
                className="user-email user-email--btn"
                onClick={() => setSession('mypage')}
              >
                {user.email}
              </button>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <button className="login-btn" onClick={handleLoginRequired}>
              로그인
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {detailTrend ? (
          <TrendDetail
            trend={detailTrend}
            isLoggedIn={!!user}
            onLoginRequired={handleLoginRequired}
            onBack={() => setDetailTrend(null)}
            currentUserId={user?.id}
          />
        ) : (
          <>
            {feedTab === 'home' && (
              <Feed
                trends={trends}
                loading={trendsLoading}
                error={devErrorOverride || trendsError}
                isLoggedIn={!!user}
                onLoginRequired={handleLoginRequired}
                onOpenDetail={setDetailTrend}
                currentUserId={user?.id}
                onCreateIdea={handleStartIdeaCreation}
                onRetry={loadTrends}
                forceNewUser={devNewUserMode}
                forceOnboarded={devOnboarded}
              />
            )}
            {feedTab === 'winglepick' && (
              <WinglePick trends={trends} loading={trendsLoading} onOpenDetail={setDetailTrend} />
            )}
            {feedTab === 'challenge' && (
              <ChallengeBoard
                trends={trends}
                loading={trendsLoading}
                onOpenDetail={(t) => { setDetailTrend(t); }}
                onCreateIdea={handleStartIdeaCreation}
              />
            )}
            {feedTab === 'ranking' && (
              <CategoryRanking trends={trends} loading={trendsLoading} />
            )}
          </>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item${feedTab === 'home' && !detailTrend ? ' active' : ''}`}
          onClick={() => { setDetailTrend(null); setFeedTab('home'); }}
        >
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-label">홈</span>
        </button>
        <button
          className={`bottom-nav-item${feedTab === 'winglepick' ? ' active' : ''}`}
          onClick={() => { setDetailTrend(null); setFeedTab('winglepick'); }}
        >
          <span className="bottom-nav-icon">⭐</span>
          <span className="bottom-nav-label">윙글픽</span>
        </button>
        <button
          className="bottom-nav-item bottom-nav-item--create"
          onClick={handleStartIdeaCreation}
        >
          <span className="bottom-nav-icon">✍️</span>
          <span className="bottom-nav-label">만들기</span>
        </button>
        <button
          className={`bottom-nav-item${feedTab === 'challenge' ? ' active' : ''}`}
          onClick={() => { setDetailTrend(null); setFeedTab('challenge'); }}
        >
          <span className="bottom-nav-icon">🏆</span>
          <span className="bottom-nav-label">챌린지</span>
        </button>
        <button
          className={`bottom-nav-item${session === 'mypage' ? ' active' : ''}`}
          onClick={handleMyPageTab}
        >
          <span className="bottom-nav-icon">👤</span>
          <span className="bottom-nav-label">마이</span>
        </button>
      </nav>

      <DevPanel
        trends={trends}
        isError={devErrorOverride || trendsError}
        currentUserIdOverride={devUserOverride}
        newUserMode={devNewUserMode}
        onToggleError={() => setDevErrorOverride((v) => !v)}
        onSetTrends={setTrends}
        onSetUserOverride={setDevUserOverride}
        onSetNewUserMode={(v) => { setDevNewUserMode(v); if (v) setDevOnboarded(false); }}
        onSetOnboarded={() => { localStorage.setItem('twing_onboarded', '1'); setDevOnboarded(true); setDevNewUserMode(false); }}
        onRetry={loadTrends}
      />
    </div>
  );
}
