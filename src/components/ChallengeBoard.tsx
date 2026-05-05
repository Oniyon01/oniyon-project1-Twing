import type { Trend } from '../types';
import { hotScore } from '../lib/ranking';
import './ChallengeBoard.css';

interface Props {
  trends: Trend[];
  loading: boolean;
  onOpenDetail: (trend: Trend) => void;
  onCreateIdea?: () => void;
}

const HOT_CHALLENGES = [
  { tag: '#아침루틴챌린지', platform: '틱톡', platformEmoji: '🎵', emoji: '🌅', desc: '기상 후 30분 루틴 공유' },
  { tag: '#감성카페투어', platform: '인스타', platformEmoji: '📸', emoji: '☕', desc: '숨겨진 감성 카페 발굴' },
  { tag: '#AI아트챌린지', platform: '유튜브쇼츠', platformEmoji: '▶️', emoji: '🤖', desc: 'AI로 나만의 아트 만들기' },
];

export default function ChallengeBoard({ trends, loading, onOpenDetail, onCreateIdea }: Props) {
  const twingChallenges = trends
    .filter((t) => t.category === '갓생')
    .sort((a, b) => hotScore(b) - hotScore(a))
    .slice(0, 5);

  return (
    <div className="challenge-board">
      {/* SNS 핫 챌린지 */}
      <section className="challenge-section">
        <div className="challenge-section-header">
          <img src="/wingle.png" alt="윙글이" className="challenge-wingle" />
          <div>
            <h2 className="challenge-section-title">SNS 핫 챌린지</h2>
            <p className="challenge-section-sub">윙글이가 가져온 이번 주 트렌드</p>
          </div>
        </div>
        <ul className="hot-challenge-list">
          {HOT_CHALLENGES.map((c) => (
            <li key={c.tag} className="hot-challenge-item">
              <span className="hot-challenge-emoji">{c.emoji}</span>
              <div className="hot-challenge-body">
                <div className="hot-challenge-top">
                  <span className="hot-challenge-tag">{c.tag}</span>
                  <span className="hot-challenge-platform">{c.platformEmoji} {c.platform}</span>
                </div>
                <span className="hot-challenge-desc">{c.desc}</span>
              </div>
              <button
                className="challenge-action-btn"
                onClick={onCreateIdea}
              >
                참여하기 →
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Twing 발 챌린지 */}
      <section className="challenge-section">
        <div className="challenge-section-header plain">
          <h2 className="challenge-section-title">Twing 발 챌린지</h2>
          <p className="challenge-section-sub">커뮤니티에서 시작된 챌린지</p>
        </div>
        {loading ? (
          <p className="challenge-empty">불러오는 중...</p>
        ) : twingChallenges.length === 0 ? (
          <p className="challenge-empty">아직 챌린지 아이디어가 없어요!</p>
        ) : (
          <ul className="twing-challenge-list">
            {twingChallenges.map((t, i) => (
              <li
                key={t.id}
                className="twing-challenge-item"
              >
                <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                <div className="twing-challenge-body">
                  <span className="twing-challenge-title">{t.title}</span>
                  <span className="twing-challenge-tag">{t.hashtag}</span>
                </div>
                <div className="twing-challenge-actions">
                  <span className="twing-challenge-votes">🔥 {t.votes.yes.toLocaleString()}</span>
                  <button
                    className="challenge-action-btn challenge-action-btn--sm"
                    onClick={() => onOpenDetail(t)}
                  >
                    보기 →
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
