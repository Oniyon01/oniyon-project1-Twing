import { useState } from 'react';
import IntroScreen from './components/IntroScreen';
import CategoryRanking from './components/CategoryRanking';
import Feed from './components/Feed';
import RankingPanel from './components/RankingPanel';
import './styles.css';

type Session = 'intro' | 'categories' | 'feed';

export default function App() {
  const [session, setSession] = useState<Session>('intro');

  if (session === 'intro') {
    return <IntroScreen onNext={() => setSession('categories')} />;
  }

  if (session === 'categories') {
    return <CategoryRanking onNext={() => setSession('feed')} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="back-btn" onClick={() => setSession('categories')} aria-label="뒤로가기">
          ← 순위 보기
        </button>
        <div className="header-center">
          <img src="/wingy.png" alt="Wingy" className="header-wingy" />
          <div className="header-brand">
            <span className="logo">Twing</span>
            <span className="slogan">트렌드를 날개로 ✦</span>
          </div>
        </div>
        <div className="header-right" />
      </header>

      <div className="app-main">
        <Feed />
        <RankingPanel />
      </div>
    </div>
  );
}
