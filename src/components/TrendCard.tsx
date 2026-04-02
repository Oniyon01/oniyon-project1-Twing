import { useState } from 'react';
import type { Trend, VoteType } from '../types';
import VoteButtons from './VoteButtons';

interface Props {
  trend: Trend;
}

export default function TrendCard({ trend }: Props) {
  const [voted, setVoted] = useState<VoteType | null>(null);
  const [votes, setVotes] = useState(trend.votes);
  const [showComments, setShowComments] = useState(false);

  function handleVote(type: VoteType) {
    if (voted) return;
    setVoted(type);
    setVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  }

  return (
    <article className="trend-card">
      <div className="wingy-bubble">
        <span className="wingy-avatar">🐦</span>
        <p className="wingy-comment">{trend.ai_comment}</p>
      </div>

      <div className="trend-image-wrap">
        <img src={trend.image_url} alt={trend.title} className="trend-image" />
        <span className="trend-hashtag">{trend.hashtag}</span>
      </div>

      <div className="trend-body">
        <h2 className="trend-title">{trend.title}</h2>
        <p className="trend-desc">{trend.description}</p>
      </div>

      <VoteButtons voted={voted} votes={votes} onVote={handleVote} />

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
