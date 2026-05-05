import { useState } from 'react';
import type { Trend } from '../types';
import { hotScore, totalScore, isThisWeek } from '../lib/ranking';
import './WinglePick.css';

type PickTab = 'realtime' | 'weekly' | 'hall';

interface Props {
  trends: Trend[];
  loading: boolean;
  onOpenDetail: (trend: Trend) => void;
}

const TABS: { key: PickTab; emoji: string; label: string; badge: string }[] = [
  { key: 'realtime', emoji: '🔥', label: '실시간 TOP 10', badge: '1시간마다 업데이트' },
  { key: 'weekly',   emoji: '🏆', label: '주간 TOP 10',   badge: '매주 일요일 자정 선정' },
  { key: 'hall',     emoji: '🏛️', label: '명예전당',      badge: '역대 윙글이 픽' },
];

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

export default function WinglePick({ trends, loading, onOpenDetail }: Props) {
  const [tab, setTab] = useState<PickTab>('realtime');

  const ranked = (() => {
    if (tab === 'realtime') {
      // 🔥 지금 핫해요 — 핫 점수 TOP 10
      return [...trends].sort((a, b) => hotScore(b) - hotScore(a)).slice(0, 10);
    }
    if (tab === 'weekly') {
      // 🏆 이번 주 TOP 10 — 월요일 0시 이후 등록, 누적 반응 점수 순
      return [...trends]
        .filter(isThisWeek)
        .sort((a, b) => totalScore(b) - totalScore(a))
        .slice(0, 10);
    }
    // 🏛️ 명예전당 — 역대 누적 반응 점수 순 (시간 가중치 없음)
    return [...trends].sort((a, b) => totalScore(b) - totalScore(a)).slice(0, 10);
  })();

  const currentTab = TABS.find((t) => t.key === tab)!;

  return (
    <div className="winglepick">
      <div className="winglepick-header">
        <img src="/wingle-3d.png" alt="윙글이" className="winglepick-wingle" />
        <div>
          <h2 className="winglepick-title">윙글이 픽</h2>
          <p className="winglepick-sub">{currentTab.badge}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="winglepick-tabs">
        {TABS.map(({ key, emoji, label }) => (
          <button
            key={key}
            className={`winglepick-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            <span className="winglepick-tab-emoji">{emoji}</span>
            <span className="winglepick-tab-label">{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="winglepick-empty">불러오는 중...</p>
      ) : ranked.length === 0 ? (
        <p className="winglepick-empty">
          {tab === 'weekly'
            ? '이번 주 등록된 아이디어가 아직 없어요!'
            : '아직 아이디어가 없어요!'}
        </p>
      ) : (
        <ul className="winglepick-list">
          {ranked.map((trend, i) => {
            const score = tab === 'realtime' ? hotScore(trend) : totalScore(trend);
            const maxScore = tab === 'realtime' ? hotScore(ranked[0]) : totalScore(ranked[0]);
            const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

            return (
              <li
                key={trend.id}
                className={`winglepick-card${i < 3 ? ' top3' : ''}${tab === 'hall' && i < 3 ? ' hall-top3' : ''}`}
                onClick={() => onOpenDetail(trend)}
              >
                <span className="winglepick-rank">
                  {i < 3
                    ? <span className="medal">{MEDAL[i]}</span>
                    : <span className="rank-num">{i + 1}</span>
                  }
                </span>
                <div className="winglepick-card-body">
                  <div className="winglepick-card-top">
                    <span className="winglepick-card-title">{trend.title}</span>
                    <span className="hashtag-chip small">{trend.hashtag}</span>
                  </div>

                  {/* 점수 바 */}
                  <div className="winglepick-bar-track">
                    <div className="winglepick-bar-fill" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="winglepick-card-footer">
                    <span className="winglepick-card-comment">"{trend.ai_comment}"</span>
                    <span className="winglepick-card-score">
                      🔥 {trend.votes.yes.toLocaleString()} · 👀 {trend.votes.maybe.toLocaleString()}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 주간 리셋 안내 */}
      {tab === 'weekly' && (
        <p className="winglepick-reset-hint">
          주간 랭킹은 매주 월요일 0시에 리셋돼요. 누적 포인트는 유지됩니다.
        </p>
      )}
    </div>
  );
}
