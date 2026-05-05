import { useState } from 'react';
import type { Trend } from '../types';
import './DevPanel.css';

interface Props {
  trends: Trend[];
  isError: boolean;
  currentUserIdOverride?: string;
  newUserMode: boolean;
  onToggleError: () => void;
  onSetTrends: (trends: Trend[]) => void;
  onSetUserOverride: (id: string | undefined) => void;
  onSetNewUserMode: (v: boolean) => void;
  onRetry: () => void;
}

const DEMO_USER_ID = 'user-demo-1';

export default function DevPanel({
  trends, isError, currentUserIdOverride, newUserMode,
  onToggleError, onSetTrends, onSetUserOverride, onSetNewUserMode, onRetry,
}: Props) {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState('');
  const [, tick] = useState(0);

  const isOnboarded = !newUserMode && localStorage.getItem('twing_onboarded') === '1';
  const isOwnCardMode = currentUserIdOverride === DEMO_USER_ID;
  const firstTrend = trends[0];
  const firstIsPickCandidate = (firstTrend?.votes.yes ?? 0) >= 300;

  function toast(msg: string) {
    setLog(msg);
    setTimeout(() => setLog(''), 2800);
  }

  function force() { tick((n) => n + 1); }

  // ── 유저 상태 ──────────────────────────────────────────
  function handleNewUser() {
    localStorage.removeItem('twing_onboarded');
    onSetNewUserMode(true);
    force();
    toast('🌱 신규유저 모드 ON → 홈 탭 확인해봐');
  }

  function handleSetOnboarded() {
    localStorage.setItem('twing_onboarded', '1');
    onSetNewUserMode(false);
    force();
    toast('✅ 온보딩 완료 처리됨');
  }

  // ── 카드 상태 ──────────────────────────────────────────
  function handleOwnCard() {
    if (isOwnCardMode) {
      onSetUserOverride(undefined);
      toast('👤 본인 카드 모드 해제');
    } else {
      onSetUserOverride(DEMO_USER_ID);
      toast(`👤 본인 카드 모드 → user-demo-1 기준`);
    }
  }

  function handlePickToggle() {
    if (!firstTrend) return;
    const updated = trends.map((t, i) =>
      i === 0 ? { ...t, votes: { ...t.votes, yes: firstIsPickCandidate ? 10 : 350 } } : t
    );
    onSetTrends(updated);
    toast(firstIsPickCandidate ? '⬇️ 픽 후보 비활성화 (yes: 10)' : '🌟 픽 후보 활성화 (yes: 350)');
  }

  // ── 숫자 생성기 ────────────────────────────────────────
  function handleAddLikes() {
    const updated = trends.map((t) => ({
      ...t,
      likes_count: (t.likes_count ?? 0) + Math.floor(Math.random() * 80 + 20),
    }));
    onSetTrends(updated);
    toast('❤️ 좋아요 랜덤 +20~100 추가됨');
  }

  function handleAddVotes() {
    const updated = trends.map((t) => ({
      ...t,
      votes: {
        yes: t.votes.yes + Math.floor(Math.random() * 50 + 10),
        maybe: t.votes.maybe + Math.floor(Math.random() * 30 + 5),
        no: t.votes.no + Math.floor(Math.random() * 15 + 2),
      },
    }));
    onSetTrends(updated);
    toast('🗳️ 투표 랜덤 추가됨');
  }

  function handleAddSeeds() {
    const seed: Trend = {
      id: `seed-test-${Date.now()}`,
      title: '테스터 시딩 카드',
      hashtag: '#테스트시딩',
      description: 'DevPanel에서 생성한 시딩 테스트 카드입니다.',
      image_url: '',
      ai_comment: '이건 테스트용 시딩 카드야! 🛠️',
      created_at: new Date().toISOString(),
      category: '테크',
      views: 0,
      votes: { yes: 5, no: 1, maybe: 3 },
      likes_count: 2,
      is_seed: true,
      user_id: 'wingle-seed',
      author_nickname: '윙글이',
      author_points: 99999,
    };
    onSetTrends([seed, ...trends]);
    toast('🌱 시딩 카드 1장 추가됨');
  }

  // ── 초기화 ─────────────────────────────────────────────
  function handleClearVotes() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('twing_voted_'));
    keys.forEach((k) => localStorage.removeItem(k));
    toast(`🗳️ 투표 ${keys.length}개 초기화 → 새로고침 필요`);
  }

  function handleClearLikes() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('twing_liked_'));
    keys.forEach((k) => localStorage.removeItem(k));
    toast(`❤️ 좋아요 ${keys.length}개 초기화 → 새로고침 필요`);
  }

  function handleResetAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('twing_'))
      .forEach((k) => localStorage.removeItem(k));
    onSetUserOverride(undefined);
    force();
    toast('🔄 모든 twing_ 스토리지 초기화됨');
  }

  return (
    <div className={`dev-panel${open ? ' dev-panel--open' : ''}`}>
      {/* 토글 버튼 */}
      <button
        className="dev-toggle"
        onClick={() => setOpen((v) => !v)}
        title="개발자 테스트 패널"
      >
        {open ? '✕' : '🛠️'}
      </button>

      {open && (
        <div className="dev-content">
          <div className="dev-header">
            <span className="dev-title">🛠️ 테스트 패널</span>
            <span className="dev-subtitle">로컬 전용 · 배포에 영향 없음</span>
          </div>

          {/* 로그 알림 */}
          {log && <div className="dev-log">{log}</div>}

          {/* 현재 상태 */}
          <div className="dev-status-grid">
            <div className={`dev-status-chip${isOnboarded ? ' ok' : ' warn'}`}>
              {isOnboarded ? '✅ 온보딩됨' : '🌱 신규유저'}
            </div>
            <div className={`dev-status-chip${isError ? ' err' : ' ok'}`}>
              {isError ? '📡 오류상태' : '🟢 정상'}
            </div>
            <div className={`dev-status-chip${isOwnCardMode ? ' active' : ' default'}`}>
              {isOwnCardMode ? '👤 본인모드' : '👻 타인모드'}
            </div>
            <div className={`dev-status-chip${firstIsPickCandidate ? ' gold' : ' default'}`}>
              {firstIsPickCandidate ? '🌟 픽후보' : '⬜ 일반카드'}
            </div>
          </div>

          {/* ── 유저 상태 ── */}
          <div className="dev-section">
            <p className="dev-section-label">👤 유저 상태</p>
            <div className="dev-btn-row">
              <button className="dev-btn warn" onClick={handleNewUser}>🌱 신규유저 모드</button>
              <button className="dev-btn ok" onClick={handleSetOnboarded}>✅ 온보딩 완료</button>
            </div>
            <div className="dev-btn-row">
              <button
                className={`dev-btn ${isOwnCardMode ? 'active' : 'default'}`}
                onClick={handleOwnCard}
              >
                {isOwnCardMode ? '👤 본인모드 해제' : '👤 본인 카드 모드'}
              </button>
            </div>
          </div>

          {/* ── 피드 상태 ── */}
          <div className="dev-section">
            <p className="dev-section-label">📡 피드 / 에러</p>
            <div className="dev-btn-row">
              <button
                className={`dev-btn ${isError ? 'active' : 'warn'}`}
                onClick={onToggleError}
              >
                {isError ? '📡 오류 해제' : '📡 네트워크 오류'}
              </button>
              <button className="dev-btn ok" onClick={onRetry}>🔄 피드 새로고침</button>
            </div>
          </div>

          {/* ── 카드 상태 ── */}
          <div className="dev-section">
            <p className="dev-section-label">🃏 카드 상태</p>
            <div className="dev-btn-row">
              <button
                className={`dev-btn ${firstIsPickCandidate ? 'active' : 'default'}`}
                onClick={handlePickToggle}
              >
                {firstIsPickCandidate ? '⬇️ 픽 후보 해제' : '🌟 픽 후보 활성화'}
              </button>
              <button className="dev-btn default" onClick={handleAddSeeds}>
                🌱 시딩 카드 추가
              </button>
            </div>
          </div>

          {/* ── 숫자 생성기 ── */}
          <div className="dev-section">
            <p className="dev-section-label">🎲 숫자 생성기</p>
            <div className="dev-btn-row">
              <button className="dev-btn default" onClick={handleAddLikes}>❤️ 좋아요 +랜덤</button>
              <button className="dev-btn default" onClick={handleAddVotes}>🗳️ 투표 +랜덤</button>
            </div>
            <p className="dev-note">
              트렌드 {trends.length}개 · 첫 카드 🔥{firstTrend?.votes.yes ?? 0} · ❤️{firstTrend?.likes_count ?? 0}
            </p>
          </div>

          {/* ── 초기화 ── */}
          <div className="dev-section">
            <p className="dev-section-label">🧹 초기화</p>
            <div className="dev-btn-row">
              <button className="dev-btn warn" onClick={handleClearVotes}>🗳️ 투표 초기화</button>
              <button className="dev-btn warn" onClick={handleClearLikes}>❤️ 좋아요 초기화</button>
            </div>
            <button className="dev-btn err full" onClick={handleResetAll}>
              💣 전체 초기화 (twing_*)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
