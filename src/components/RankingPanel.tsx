import { Trend } from '../types';
import './RankingPanel.css';

interface Props {
  trends: Trend[];
}

export default function RankingPanel({ trends }: Props) {
  const scored = trends
    .map((t) => {
      const total = t.votes.yes + t.votes.no + t.votes.maybe;
      const score = total === 0 ? 0 : Math.round((t.votes.yes / total) * 100);
      return { ...t, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <aside className="ranking-panel">
      <h3 className="ranking-title">🔥 트렌드 랭킹</h3>
      <ul className="ranking-list">
        {scored.map((t, i) => (
          <li key={t.id} className="ranking-item">
            <span className="rank-num">{i + 1}</span>
            <div className="rank-info">
              <span className="rank-hashtag">{t.hashtag}</span>
              <span className="rank-score">{t.score}% 맞다</span>
            </div>
            <span className="rank-arrow">{i === 0 ? '🔺' : '▸'}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
