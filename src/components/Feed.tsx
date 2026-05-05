import { useState, useRef } from 'react';
import type { Trend } from '../types';
import TrendCard from './TrendCard';
import EmptyFeed from './EmptyFeed';
import { hotScore } from '../lib/ranking';

interface Props {
  trends: Trend[];
  loading: boolean;
  error?: boolean;
  errorCode?: string;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onOpenDetail: (trend: Trend) => void;
  currentUserId?: string;
  onCreateIdea: () => void;
  onRetry?: () => void;
  forceNewUser?: boolean;
}

type SortMode = 'newest' | 'hot';

export default function Feed({
  trends, loading, error, errorCode,
  isLoggedIn, onLoginRequired, onOpenDetail,
  currentUserId, onCreateIdea, onRetry, forceNewUser,
}: Props) {
  const [sort, setSort] = useState<SortMode>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const isOnboarded = !forceNewUser && localStorage.getItem('twing_onboarded') === '1';

  const sorted = [...trends].sort((a, b) =>
    sort === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : hotScore(b) - hotScore(a)
  );

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? sorted.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.hashtag.toLowerCase().includes(query)
      )
    : sorted;

  function clearSearch() {
    setSearchQuery('');
    searchRef.current?.focus();
  }

  const userGeneratedTrends = trends.filter(t => !t.is_seed);
  const isNewUser = forceNewUser || (!isOnboarded && userGeneratedTrends.length === 0);

  if (loading) {
    return (
      <div className="feed">
        <div className="feed-loading-wrap">
          <div className="feed-loading-avatar">W</div>
          <p className="feed-loading">아이디어 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed">
        <EmptyFeed
          type="error"
          onCreateIdea={onCreateIdea}
          onRetry={onRetry}
          errorCode={errorCode ?? 'NETWORK_TIMEOUT'}
        />
      </div>
    );
  }

  // A 상태: 신규 유저 (검색 없을 때만)
  if (isNewUser && !query) {
    return (
      <div className="feed">
        <div className="feed-sort-tabs">
          <button
            className={`sort-tab${sort === 'newest' ? ' active' : ''}`}
            onClick={() => setSort('newest')}
          >🕐 최신순</button>
          <button
            className={`sort-tab${sort === 'hot' ? ' active' : ''}`}
            onClick={() => setSort('hot')}
          >🔥 인기순</button>
        </div>
        <EmptyFeed type="new-user" onCreateIdea={onCreateIdea} />
      </div>
    );
  }

  return (
    <div className="feed">
      {/* 검색바 */}
      <div className="feed-search-wrap">
        <span className="feed-search-icon">🔍</span>
        <input
          ref={searchRef}
          type="text"
          className="feed-search-input"
          placeholder="제목, 설명, 해시태그로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="feed-search-clear"
            onClick={clearSearch}
            aria-label="검색어 지우기"
          >✕</button>
        )}
      </div>

      {/* 검색 결과 카운트 */}
      {query && (
        <p className="feed-search-count">
          {filtered.length > 0
            ? `"${searchQuery}" 검색 결과 ${filtered.length}개`
            : `"${searchQuery}"와 일치하는 결과가 없어요`}
        </p>
      )}

      {/* 아이디어 등록 CTA (검색 중이 아닐 때) */}
      {!query && (
        <button className="feed-create-btn" onClick={onCreateIdea}>
          <span className="feed-create-icon">✍️</span>
          <div className="feed-create-text">
            <span className="feed-create-main">내 트렌드 아이디어 등록하기</span>
            <span className="feed-create-sub">윙글이가 3가지 방향으로 다듬어줄게 →</span>
          </div>
        </button>
      )}

      {/* 정렬 탭 */}
      <div className="feed-sort-tabs">
        <button
          className={`sort-tab${sort === 'newest' ? ' active' : ''}`}
          onClick={() => setSort('newest')}
        >🕐 최신순</button>
        <button
          className={`sort-tab${sort === 'hot' ? ' active' : ''}`}
          onClick={() => setSort('hot')}
        >🔥 인기순</button>
      </div>

      {/* 카드 목록 */}
      {filtered.map((trend) => (
        <TrendCard
          key={trend.id}
          trend={trend}
          isLoggedIn={isLoggedIn}
          onLoginRequired={onLoginRequired}
          onOpenDetail={onOpenDetail}
          currentUserId={currentUserId}
        />
      ))}

      {/* B 상태: 검색 결과 없음 */}
      {filtered.length === 0 && query && (
        <EmptyFeed
          type="no-results"
          searchQuery={searchQuery}
          onCreateIdea={onCreateIdea}
          onClearSearch={clearSearch}
        />
      )}
    </div>
  );
}
