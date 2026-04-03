import { useState } from 'react';
import { trends } from '../data/trends';
import type { Category, CategoryMeta } from '../types';
import './CategoryRanking.css';

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

interface Props {
  onNext: () => void;
}

export default function CategoryRanking({ onNext }: Props) {
  const [activeTab, setActiveTab] = useState<Category>('challenge');
  const [leaving, setLeaving] = useState(false);

  const ranked = trends
    .filter((t) => t.category === activeTab)
    .sort((a, b) => trendScore(b.votes) - trendScore(a.votes));

  function handleNext() {
    setLeaving(true);
    setTimeout(onNext, 500);
  }

  return (
    <div className={`category-screen${leaving ? ' category-leaving' : ''}`}>
      <div className="category-header">
        <img src="/wingy.png" alt="Wingy" className="category-wingy" />
        <div>
          <h1 className="category-title">카테고리별 순위</h1>
          <p className="category-sub">지금 어떤 게 가장 핫할까?</p>
        </div>
      </div>

      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`tab-btn${activeTab === cat.key ? ' active' : ''}`}
            onClick={() => setActiveTab(cat.key)}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <div className="ranking-list">
        {ranked.length === 0 ? (
          <p className="ranking-empty">이 카테고리엔 아직 트렌드가 없어요!</p>
        ) : (
          ranked.map((trend, idx) => {
            const score = trendScore(trend.votes);
            const maxScore = trendScore(ranked[0].votes);
            const pct = Math.round((score / maxScore) * 100);
            return (
              <div key={trend.id} className="ranking-item">
                <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                <div className="ranking-info">
                  <div className="ranking-top">
                    <span className="ranking-name">{trend.title}</span>
                    <span className="ranking-hashtag">{trend.hashtag}</span>
                  </div>
                  <div className="ranking-bar-track">
                    <div
                      className="ranking-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="ranking-score">🔥 {score.toLocaleString()} 반응</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="category-next-btn" onClick={handleNext}>
        트렌드 카드 보러가기 →
      </button>
    </div>
  );
}
