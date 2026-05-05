import { useState } from 'react';
import type { Trend, Category } from '../types';
import { CATEGORIES } from '../theme/categories';
import './RankingPanel.css';

function trendScore(votes: { yes: number; no: number; maybe: number }) {
  return votes.yes - votes.no;
}

interface Props {
  trends: Trend[];
}

export default function RankingPanel({ trends }: Props) {
  const [activeTab, setActiveTab] = useState<Category>('갓생');

  const ranked = trends
    .filter((t) => t.category === activeTab)
    .sort((a, b) => trendScore(b.votes) - trendScore(a.votes));

  const maxScore = ranked.length > 0 ? trendScore(ranked[0].votes) : 1;

  return (
    <aside className="ranking-panel">
      <div className="rp-header">
        <img src="/wingle.png" alt="윙글이" className="rp-wingle" />
        <span className="rp-title">트렌드 순위</span>
      </div>

      <div className="rp-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`rp-tab${activeTab === cat.key ? ' active' : ''}`}
            onClick={() => setActiveTab(cat.key)}
            title={cat.key}
          >
            {cat.emoji}
          </button>
        ))}
      </div>
      <p className="rp-tab-label">
        {CATEGORIES.find((c) => c.key === activeTab)?.key}
      </p>

      <ul className="rp-list">
        {ranked.length === 0 ? (
          <li className="rp-empty">트렌드 없음</li>
        ) : (
          ranked.map((t, i) => {
            const score = trendScore(t.votes);
            const pct = Math.round((score / maxScore) * 100);
            return (
              <li key={t.id} className="rp-item">
                <span className={`rp-rank rank-${i + 1}`}>{i + 1}</span>
                <div className="rp-info">
                  <span className="rp-name">{t.title}</span>
                  <div className="rp-bar-track">
                    <div className="rp-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="rp-score">🔥 {score.toLocaleString()}</span>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
