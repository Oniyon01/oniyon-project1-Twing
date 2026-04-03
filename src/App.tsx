import { useState } from 'react';
import IntroScreen from './components/IntroScreen';
import CategoryRanking from './components/CategoryRanking';
import Feed from './components/Feed';
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
        <img src="/wingy.png" alt="Wingy" className="header-wingy" />
        <div className="header-brand">
          <span className="logo">Twing</span>
          <span className="slogan">트렌드를 날개로 ✦</span>
        </div>
      </header>
      <Feed />
    </div>
  );
}
