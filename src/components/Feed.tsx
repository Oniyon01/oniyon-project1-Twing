import { trends } from '../data/trends';
import TrendCard from './TrendCard';

export default function Feed() {
  return (
    <div className="feed">
      <div className="feed-banner">
        <img src="/wingy-3d.png" alt="Wingy" className="feed-banner-img" />
        <div className="feed-banner-text">
          <p className="feed-banner-greeting">안녕! 나는 Wingy야 👋</p>
          <p className="feed-banner-sub">오늘의 트렌드를 같이 살펴볼까요?</p>
        </div>
      </div>
      {trends.map((trend) => (
        <TrendCard key={trend.id} trend={trend} />
      ))}
    </div>
  );
}
