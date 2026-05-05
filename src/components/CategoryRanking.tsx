import { useState } from 'react';
import type { Trend, Category } from '../types';
import { CATEGORIES } from '../theme/categories';
import { totalScore } from '../lib/ranking';
import './CategoryRanking.css';

interface Props {
  trends: Trend[];
  loading: boolean;
  onNext?: () => void;
}

export default function CategoryRanking({ trends, loading, onNext }: Props) {
  const [activeTab, setActiveTab] = useState<Category>('갓생');
  const [leaving, setLeaving] = useState(false);

  const ranked = trends
    .filter((t) => t.category === activeTab)
    .sort((a, b) => totalScore(b) - totalScore(a));

  function handleNext() {
    if (!onNext) return;
    setLeaving(true);
    setTimeout(onNext, 500);
  }

  return (
    <div className={`category-screen${leaving ? ' category-leaving' : ''}`}>
      <div className="category-header">
        <img src="/wingle.png" alt="윙글이" className="category-wingle" />
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
            {cat.emoji} {cat.key}
          </button>
        ))}
      </div>

      <div className="ranking-list">
        {loading ? (
          <p className="ranking-empty">순위 불러오는 중...</p>
        ) : ranked.length === 0 ? (
          <p className="ranking-empty">이 카테고리엔 아직 트렌드가 없어요!</p>
        ) : (
          ranked.map((trend, idx) => {
            const score = totalScore(trend);
            const maxScore = totalScore(ranked[0]);
            const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
            return (
              <div key={trend.id} className="ranking-item">
                <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                <div className="ranking-info">
                  <div className="ranking-top">
                    <span className="ranking-name">{trend.title}</span>
                    <span className="ranking-hashtag">{trend.hashtag}</span>
                  </div>
                  <div className="ranking-bar-track">
                    <div className="ranking-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="ranking-score">
                    🔥 직접 해볼래 {trend.votes.yes.toLocaleString()} · 👀 보는 건 좋아 {trend.votes.maybe.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onNext && (
        <button className="category-next-btn" onClick={handleNext}>
          피드 보러가기 →
        </button>
      )}
    </div>
  );
}
