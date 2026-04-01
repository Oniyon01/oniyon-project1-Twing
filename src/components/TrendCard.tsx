import { useState } from 'react';
import { Trend, VoteType } from '../types';
import './TrendCard.css';

interface Props {
  trend: Trend;
}

export default function TrendCard({ trend }: Props) {
  const [voted, setVoted] = useState<VoteType | null>(null);
  const [votes, setVotes] = useState(trend.votes);
  const [showComments, setShowComments] = useState(false);

  const total = votes.yes + votes.no + votes.maybe;
  const pct = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);

  function handleVote(type: VoteType) {
    if (voted) return;
    setVoted(type);
    setVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  }

  return (
    <article className="trend-card">
      {/* 윙이 멘트 */}
      <div className="wingy-bubble">
        <span className="wingy-avatar">🐦</span>
        <p className="wingy-comment">{trend.ai_comment}</p>
      </div>

      {/* 이미지 */}
      <div className="trend-image-wrap">
        <img src={trend.image_url} alt={trend.title} className="trend-image" />
        <span className="trend-hashtag">{trend.hashtag}</span>
      </div>

      {/* 본문 */}
      <div className="trend-body">
        <h2 className="trend-title">{trend.title}</h2>
        <p className="trend-desc">{trend.description}</p>
      </div>

      {/* 투표 버튼 */}
      <div className="vote-section">
        {voted ? (
          <div className="vote-result">
            <VoteBar label="👍 맞다" value={pct(votes.yes)} active={voted === 'yes'} />
            <VoteBar label="👎 아니다" value={pct(votes.no)} active={voted === 'no'} />
            <VoteBar label="🤔 모르겠다" value={pct(votes.maybe)} active={voted === 'maybe'} />
            <p className="vote-total">총 {total.toLocaleString()}명 참여</p>
          </div>
        ) : (
          <div className="vote-buttons">
            <button className="vote-btn yes" onClick={() => handleVote('yes')}>👍 맞다</button>
            <button className="vote-btn no" onClick={() => handleVote('no')}>👎 아니다</button>
            <button className="vote-btn maybe" onClick={() => handleVote('maybe')}>🤔 모르겠다</button>
          </div>
        )}
      </div>

      {/* 댓글 토글 */}
      <button className="comment-toggle" onClick={() => setShowComments((v) => !v)}>
        💬 댓글 {showComments ? '닫기' : '보기'}
      </button>
      {showComments && (
        <div className="comment-section">
          <p className="comment-empty">아직 댓글이 없어요. 첫 번째로 의견을 남겨보세요!</p>
          <div className="comment-input-row">
            <input type="text" placeholder="의견을 입력하세요..." className="comment-input" />
            <button className="comment-submit">등록</button>
          </div>
        </div>
      )}
    </article>
  );
}

function VoteBar({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={`vote-bar-row ${active ? 'active' : ''}`}>
      <span className="vote-bar-label">{label}</span>
      <div className="vote-bar-track">
        <div className="vote-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="vote-bar-pct">{value}%</span>
    </div>
  );
}
