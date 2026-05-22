import { useState, useEffect, useRef } from 'react';
import type { Trend, VoteType, Comment } from '../types';
import VoteButtons from './VoteButtons';
import { castVote, changeVote, removeVote, fetchComments, fetchCommentCount, addComment, incrementViews } from '../lib/trends';
import CommentAuthor from './CommentAuthor';
import { getCategoryMeta, getCategoryColor } from '../theme/categories';
import './TrendDetail.css';

type Platform = 'tiktok' | 'insta' | 'shorts';
const PLATFORM_OPTIONS: { type: Platform; label: string; emoji: string }[] = [
  { type: 'tiktok',  label: '틱톡',       emoji: '🎵' },
  { type: 'insta',   label: '인스타',     emoji: '📸' },
  { type: 'shorts',  label: '유튜브쇼츠', emoji: '▶️' },
];

interface Props {
  trend: Trend;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onBack: () => void;
  currentUserId?: string;
}

export default function TrendDetail({ trend, isLoggedIn, onLoginRequired, onBack, currentUserId }: Props) {
  const storageKey = `twing_voted_${trend.id}`;
  const platformKey = `twing_platform_${trend.id}`;

  const [voted, setVoted] = useState<VoteType | null>(
    () => localStorage.getItem(storageKey) as VoteType | null
  );
  const [votes, setVotes] = useState(trend.votes);
  const [voteLoginPrompt, setVoteLoginPrompt] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(
    () => localStorage.getItem(platformKey) as Platform | null
  );

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentLoginPrompt, setCommentLoginPrompt] = useState(false);

  const viewCounted = useRef(false);

  useEffect(() => {
    const sessionKey = `twing_viewed_${trend.id}`;
    if (!sessionStorage.getItem(sessionKey) && !viewCounted.current) {
      viewCounted.current = true;
      sessionStorage.setItem(sessionKey, '1');
      incrementViews(trend.id).catch(console.error);
    }
  }, [trend.id]);

  useEffect(() => {
    setCommentsLoading(true);
    fetchComments(trend.id)
      .then((data) => {
        setComments(data);
        setCommentCount(data.length);
      })
      .catch(console.error)
      .finally(() => setCommentsLoading(false));
  }, [trend.id]);

  useEffect(() => {
    fetchCommentCount(trend.id).then(setCommentCount).catch(() => {});
  }, [trend.id]);

  useEffect(() => {
    setVotes(trend.votes);
  }, [trend.votes.yes, trend.votes.no, trend.votes.maybe]);

  function handleVote(type: VoteType) {
    if (!isLoggedIn) { setVoteLoginPrompt(true); return; }

    if (voted === type) {
      setVoted(null);
      setVotes((prev) => ({ ...prev, [type]: prev[type] - 1 }));
      localStorage.removeItem(storageKey);
      removeVote(trend.id, type).catch(console.error);
      return;
    }

    if (voted) {
      const oldVote = voted;
      setVoted(type);
      setVotes((prev) => ({ ...prev, [oldVote]: prev[oldVote] - 1, [type]: prev[type] + 1 }));
      localStorage.setItem(storageKey, type);
      changeVote(trend.id, oldVote, type).catch(console.error);
      return;
    }

    setVoted(type);
    setVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    localStorage.setItem(storageKey, type);
    castVote(trend.id, type).catch(console.error);
  }

  function handlePlatform(p: Platform) {
    if (platform === p) return;
    setPlatform(p);
    localStorage.setItem(platformKey, p);
  }

  async function handleCommentSubmit() {
    if (!isLoggedIn) { setCommentLoginPrompt(true); return; }
    const text = commentText.trim();
    if (!text) return;
    setCommentText('');
    try {
      const comment = await addComment(trend.id, text);
      setComments((prev) => [...prev, comment]);
      setCommentCount((c) => (c ?? 0) + 1);
    } catch (e) {
      console.error(e);
    }
  }

  const catMeta = getCategoryMeta(trend.category);

  return (
    <div className="trend-detail">
      {/* 헤더 */}
      <div className="detail-header">
        <button className="detail-back" onClick={onBack}>← 뒤로</button>
        <span
          className="cat-badge"
          style={catMeta ? { background: catMeta.bg, color: getCategoryColor(catMeta), border: `1px solid ${catMeta.border}` } : undefined}
        >
          {catMeta ? `${catMeta.emoji} ${catMeta.key}` : trend.category}
        </span>
      </div>

      {/* 본문 */}
      <div className="detail-body">
        <h1 className="detail-title">{trend.title}</h1>
        <p className="detail-desc">{trend.description}</p>

        <div className="detail-hashtag-row">
          {(trend.hashtags?.length ? trend.hashtags : [trend.hashtag]).filter(Boolean).map((tag) => (
            <span key={tag} className="hashtag-chip">{tag}</span>
          ))}
        </div>

        {/* 윙글이 코멘트 */}
        <div className="detail-wingle-box">
          <img src="/wingle-3d.png" alt="윙글이" className="detail-wingle-avatar" />
          <p className="detail-wingle-text">{trend.ai_comment}</p>
        </div>

        {/* 참여 의향 */}
        <section className="detail-section">
          <p className="detail-section-label">참여 의향</p>
          <VoteButtons
            voted={voted}
            votes={votes}
            onVote={handleVote}
          />
          {voteLoginPrompt && (
            <div className="login-prompt">
              투표하려면 로그인이 필요해요.
              <button className="login-prompt-btn" onClick={onLoginRequired}>로그인하기</button>
            </div>
          )}
        </section>

        {/* 추천 플랫폼 */}
        <section className="detail-section">
          <p className="detail-section-label">추천 플랫폼</p>
          <p className="detail-section-sub">어디에 올리면 잘 맞을까요?</p>
          <div className="platform-buttons">
            {PLATFORM_OPTIONS.map(({ type, label, emoji }) => (
              <button
                key={type}
                className={`platform-btn${platform === type ? ' selected' : ''}`}
                onClick={() => handlePlatform(type)}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </section>

        {/* 추가 제안 */}
        <section className="detail-section">
          <p className="detail-section-label">
            추가 제안{commentCount !== null && commentCount > 0 ? ` (${commentCount})` : ''}
          </p>
          <p className="detail-section-sub">아이디어를 보완할 제안을 남겨보세요</p>

          {commentsLoading ? (
            <p className="comment-empty">불러오는 중...</p>
          ) : comments.length === 0 ? (
            <p className="comment-empty">아직 제안이 없어요. 첫 번째로 남겨보세요!</p>
          ) : (
            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <CommentAuthor
                    nickname={c.nickname}
                    avatarUrl={c.avatar_url}
                    userId={c.user_id}
                    currentUserId={currentUserId}
                  />
                  <div className="comment-content-row">
                    <span className="comment-content">{c.content}</span>
                    <span className="comment-time">
                      {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {commentLoginPrompt && !isLoggedIn ? (
            <div className="login-prompt">
              제안을 남기려면 로그인이 필요해요.
              <button className="login-prompt-btn" onClick={onLoginRequired}>로그인하기</button>
            </div>
          ) : (
            <div className="comment-input-row">
              <input
                type="text"
                placeholder={isLoggedIn ? '아이디어를 보완할 제안을 입력하세요...' : '로그인 후 제안을 남길 수 있어요'}
                className="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                onFocus={() => { if (!isLoggedIn) setCommentLoginPrompt(true); }}
                maxLength={300}
                readOnly={!isLoggedIn}
              />
              <button className="comment-submit" onClick={handleCommentSubmit}>등록</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
