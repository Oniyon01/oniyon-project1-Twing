import { useState, useEffect, useRef } from 'react';
import type { Trend, VoteType, Comment } from '../types';
import VoteButtons from './VoteButtons';
import { hotScore as calcHotScore, getGrade } from '../lib/ranking';
import { castVote, changeVote, removeVote, fetchComments, fetchCommentCount, addComment, incrementViews } from '../lib/trends';
import CommentAuthor from './CommentAuthor';
import { getCategoryMeta, getCategoryColor } from '../theme/categories';

interface Props {
  trend: Trend;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onOpenDetail: (trend: Trend) => void;
  currentUserId?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins < 1 ? '방금' : `${mins}분`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}시간`;
  return `${Math.floor(hours / 24)}일`;
}

export default function TrendCard({ trend, isLoggedIn, onLoginRequired, onOpenDetail, currentUserId }: Props) {
  const storageKey = `twing_voted_${trend.id}`;

  const [voted, setVoted] = useState<VoteType | null>(
    () => localStorage.getItem(storageKey) as VoteType | null
  );
  const [votes, setVotes] = useState(trend.votes);
  const [views, setViews] = useState(trend.views);
  const cardRef = useRef<HTMLElement>(null);
  const viewCounted = useRef(false);
  const [voteLoginPrompt, setVoteLoginPrompt] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentLoginPrompt, setCommentLoginPrompt] = useState(false);
  const commentsLoaded = useRef(false);

  useEffect(() => {
    setVotes(trend.votes);
  }, [trend.votes.yes, trend.votes.no, trend.votes.maybe]);

  useEffect(() => {
    if (!showMenu) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showMenu]);

  useEffect(() => {
    const sessionKey = `twing_viewed_${trend.id}`;
    if (sessionStorage.getItem(sessionKey)) viewCounted.current = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewCounted.current) {
          viewCounted.current = true;
          sessionStorage.setItem(sessionKey, '1');
          setViews((v) => v + 1);
          incrementViews(trend.id).catch(console.error);
        }
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [trend.id]);

  useEffect(() => {
    fetchCommentCount(trend.id).then(setCommentCount).catch(() => {});
  }, [trend.id]);

  useEffect(() => {
    if (!showComments || commentsLoaded.current) return;
    setCommentsLoading(true);
    fetchComments(trend.id)
      .then((data) => {
        setComments(data);
        setCommentCount(data.length);
        commentsLoaded.current = true;
      })
      .catch(console.error)
      .finally(() => setCommentsLoading(false));
  }, [showComments, trend.id]);

  const isOwnCard = !!(currentUserId && trend.user_id && trend.user_id === currentUserId);
  const isPickCandidate = !!(trend.is_pick_candidate || votes.yes >= 300);

  const hs = isOwnCard
    ? Math.round(calcHotScore({ ...trend, votes, views }))
    : undefined;

  const grade = getGrade(trend.author_points ?? 0);

  function handleVote(type: VoteType) {
    if (!isLoggedIn) { setVoteLoginPrompt(true); return; }
    if (isOwnCard) return;

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
  const cardClass = [
    'trend-card',
    isPickCandidate ? 'trend-card--gold' : '',
    isOwnCard ? 'trend-card--own' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={cardClass} ref={cardRef}>
      {isPickCandidate && (
        <div className="pick-badge">🌟 윙글이 픽 후보</div>
      )}

      {/* 메타 행: 카테고리 · 작성자 · 시간 · ⋯ */}
      <div className="card-meta">
        <span
          className="cat-badge"
          style={catMeta ? { background: catMeta.bg, color: getCategoryColor(catMeta), border: `1px solid ${catMeta.border}` } : undefined}
        >
          {catMeta ? `${catMeta.emoji} ${catMeta.key}` : trend.category}
        </span>
        <span className="card-author">
          {trend.author_nickname
            ? `@${trend.author_nickname} · ${grade.icon} ${grade.name}`
            : `${grade.icon} ${grade.name}`}
        </span>
        <span className="card-time">{timeAgo(trend.created_at)}</span>
        {isOwnCard && <span className="own-badge">내 카드</span>}
        <div className="card-more-wrap" ref={menuRef}>
          <button
            className="card-more-btn"
            onClick={() => setShowMenu((v) => !v)}
            title="더보기"
          >⋯</button>
          {showMenu && (
            <div className="card-more-menu">
              <button
                className="card-more-menu-item"
                onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowMenu(false); }}
              >🔗 공유하기</button>
              {!isOwnCard && (
                <button
                  className="card-more-menu-item card-more-menu-item--danger"
                  onClick={() => setShowMenu(false)}
                >🚩 신고하기</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 제목 + 설명 */}
      <div className="trend-body trend-body--clickable" onClick={() => onOpenDetail(trend)}>
        <h2 className="trend-title">{trend.title}</h2>
        {trend.variant_angle && (
          <span className="trend-angle-badge">💡 {trend.variant_angle}</span>
        )}
        <p className="trend-desc">{trend.description}</p>
        <span className="trend-detail-hint">자세히 보기 →</span>
      </div>

      {/* 작성자 한마디 */}
      {trend.author_note && (
        <div className="trend-author-note">
          <span className="trend-author-note-icon">✏️</span>
          <p className="trend-author-note-text">{trend.author_note}</p>
        </div>
      )}

      {/* 해시태그 */}
      <div className="hashtag-row">
        {(trend.hashtags?.length ? trend.hashtags : [trend.hashtag]).filter(Boolean).map((tag) => (
          <span key={tag} className="hashtag-chip">{tag}</span>
        ))}
      </div>

      {/* 윙글이 코멘트 인라인 1줄 */}
      <div className="wingle-comment-box">
        <img src="/wingle-3d.png" alt="윙글이" className="wingle-avatar-sm" />
        <p className="wingle-comment-text">{trend.ai_comment}</p>
      </div>

      {/* 투표 버튼 또는 본인 카드 통계 */}
      <div className="vote-section">
        <VoteButtons
          voted={voted}
          votes={votes}
          onVote={handleVote}
          isOwnCard={isOwnCard}
          hotScoreValue={hs}
        />
      </div>

      {voteLoginPrompt && (
        <div className="login-prompt">
          투표하려면 로그인이 필요해요.
          <button className="login-prompt-btn" onClick={onLoginRequired}>로그인하기</button>
        </div>
      )}

      {/* 하단 액션바: 댓글 · 공유 */}
      <div className="card-action-bar">
        <button className="card-action-comment" onClick={() => setShowComments((v) => !v)}>
          <span className="card-action-comment-icon">💬</span>
          <span className="card-action-comment-count">{commentCount ?? 0}</span>
        </button>

        {isOwnCard ? (
          <button className="card-action-analysis" onClick={() => onOpenDetail(trend)}>
            📊 상세 분석 보기
          </button>
        ) : (
          <button className="card-action-share">🔗 공유</button>
        )}
      </div>

      {showComments && (
        <div className="comment-section">
          {commentsLoading ? (
            <p className="comment-empty">불러오는 중...</p>
          ) : comments.length === 0 ? (
            <p className="comment-empty">아직 제안이 없어요. 아이디어를 보완해보세요!</p>
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
              댓글을 달려면 로그인이 필요해요.
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
        </div>
      )}
    </article>
  );
}
