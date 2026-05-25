import { useState, useRef, useEffect } from 'react';
import type { Trend } from '../types';
import TrendCard from './TrendCard';
import EmptyFeed from './EmptyFeed';
import { hotScore } from '../lib/ranking';

const HOT_RANK_COUNT = 10;
const HOT_RANK_INTERVAL_MS = 5 * 60 * 1000; // 5분
const REALTIME_RANK_COUNT = 10;
const REALTIME_RANK_INTERVAL_MS = 30 * 60 * 1000; // 30분

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
  forceOnboarded?: boolean;
  hotSimTick?: number;
  hotResetTick?: number;
  realtimeSimTick?: number;
}

type SortMode = 'newest' | 'hot';

export default function Feed({
  trends, loading, error, errorCode,
  isLoggedIn, onLoginRequired, onOpenDetail,
  currentUserId, onCreateIdea, onRetry, forceNewUser, forceOnboarded,
  hotSimTick, hotResetTick, realtimeSimTick,
}: Props) {
  const [sort, setSort] = useState<SortMode>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const trendsRef = useRef(trends);
  trendsRef.current = trends;
  // HOT 뱃지: 5분 전 대비 핫점수 증가량(delta) Top 10
  const [hotRanks, setHotRanks] = useState<Map<string, number>>(() => new Map());
  const prevScoresRef = useRef<Map<string, number>>(new Map());
  const prevInitializedRef = useRef(false);
  const tickRef = useRef<() => void>(() => {});
  // 실시간 TOP10: 30분 스냅샷 (절대 핫점수 기준)
  const [realtimeRanks, setRealtimeRanks] = useState<Map<string, number>>(() => new Map());
  const realtimeSnapshotRef = useRef<() => void>(() => {});

  // trends가 처음 로드됐을 때 기준점 초기화 (mount 시점엔 빈 배열일 수 있음)
  useEffect(() => {
    if (trends.length > 0 && !prevInitializedRef.current) {
      prevScoresRef.current = new Map(trends.map(t => [t.id, hotScore(t)]));
      prevInitializedRef.current = true;
    }
  }, [trends]);

  useEffect(() => {
    const tick = () => {
      const curr = new Map(trendsRef.current.map(t => [t.id, hotScore(t)]));
      const prev = prevScoresRef.current;

      const top = trendsRef.current
        .map(t => ({ id: t.id, delta: (curr.get(t.id) ?? 0) - (prev.get(t.id) ?? curr.get(t.id) ?? 0) }))
        .filter(d => d.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, HOT_RANK_COUNT);

      const ranks = new Map<string, number>();
      top.forEach(({ id }, i) => ranks.set(id, i + 1));
      setHotRanks(ranks);

      prevScoresRef.current = curr;
    };

    tickRef.current = tick;
    const id = setInterval(tick, HOT_RANK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // 개발 패널에서 5분 경과 시뮬
  useEffect(() => {
    if (hotSimTick) tickRef.current();
  }, [hotSimTick]);

  // 개발 패널에서 HOT 기준점 리셋
  useEffect(() => {
    if (hotResetTick) {
      prevScoresRef.current = new Map(trendsRef.current.map(t => [t.id, hotScore(t)]));
      setHotRanks(new Map());
    }
  }, [hotResetTick]);

  // 실시간 TOP10 스냅샷 (30분마다)
  useEffect(() => {
    const snapshot = () => {
      const sorted = [...trendsRef.current]
        .sort((a, b) => hotScore(b) - hotScore(a))
        .slice(0, REALTIME_RANK_COUNT);
      const map = new Map<string, number>();
      sorted.forEach((t, i) => map.set(t.id, i + 1));
      setRealtimeRanks(map);
    };
    realtimeSnapshotRef.current = snapshot;
    snapshot();
    const id = setInterval(snapshot, REALTIME_RANK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // 개발 패널에서 30분 경과 시뮬
  useEffect(() => {
    if (realtimeSimTick) realtimeSnapshotRef.current();
  }, [realtimeSimTick]);

  const isOnboarded = forceOnboarded || (!forceNewUser && localStorage.getItem('twing_onboarded') === '1');

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
          {onRetry && (
            <button className="feed-refresh-btn" onClick={onRetry} title="피드 새로고침">↻</button>
          )}
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
        {onRetry && (
          <button
            className="feed-refresh-btn"
            onClick={onRetry}
            title="피드 새로고침"
          >↻</button>
        )}
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
          hotRank={hotRanks.get(trend.id)}
          realtimeRank={realtimeRanks.get(trend.id)}
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
