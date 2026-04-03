import { useState } from 'react';
import { trends } from '../data/trends';
import type { Category, CategoryMeta } from '../types';
import './RankingPanel.css';

const CATEGORIES: CategoryMeta[] = [
  { key: 'challenge', label: '챌린지', emoji: '🔥' },
  { key: 'cafe',      label: '카페/푸드', emoji: '☕' },
  { key: 'travel',    label: '여행',   emoji: '✈️' },
  { key: 'lifestyle', label: '라이프', emoji: '🌿' },
  { key: 'tech',      label: '테크',   emoji: '🤖' },
];

function trendScore(votes: { yes: number; no: number; maybe: number }) {
  return votes.yes + votes.maybe;
}

export default function RankingPanel() {
  const [activeTab, setActiveTab] = useState<Category>('challenge');

  const ranked = trends
    .filter((t) => t.category === activeTab)
    .sort((a, b) => trendScore(b.votes) - trendScore(a.votes));

  const maxScore = ranked.length > 0 ? trendScore(ranked[0].votes) : 1;

  return (
    <aside className="ranking-panel">
      <div className="rp-header">
        <img src="/wingy.png" alt="Wingy" className="rp-wingy" />
        <span className="rp-title">트렌드 순위</span>
      </div>

      <div className="rp-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`rp-tab${activeTab === cat.key ? ' active' : ''}`}
            onClick={() => setActiveTab(cat.key)}
            title={cat.label}
          >
            {cat.emoji}
          </button>
        ))}
      </div>
      <p className="rp-tab-label">
        {CATEGORIES.find((c) => c.key === activeTab)?.label}
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
