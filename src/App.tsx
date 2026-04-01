import { mockTrends } from './data/mockTrends';
import TrendCard from './components/TrendCard';
import RankingPanel from './components/RankingPanel';
import './App.css';

export default function App() {
  return (
    <div className="app">
      {/* 헤더 */}
      <header className="app-header">
        <span className="logo">🐦 Twing</span>
        <span className="slogan">이거 진짜 유행 맞아?</span>
      </header>

      {/* 본문 */}
      <main className="app-main">
        <div className="feed">
          {mockTrends.map((trend) => (
            <TrendCard key={trend.id} trend={trend} />
          ))}
        </div>
        <RankingPanel trends={mockTrends} />
      </main>
    </div>
  );
}
