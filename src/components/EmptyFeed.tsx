import './EmptyFeed.css';

interface Props {
  type: 'new-user' | 'no-results' | 'error';
  onCreateIdea: () => void;
  onClearSearch?: () => void;
  onRetry?: () => void;
  searchQuery?: string;
  errorCode?: string;
}

const SEEDING_CARDS = [
  {
    id: 'seed-1',
    categoryLabel: '🌱 라이프',
    categoryClass: 'lifestyle',
    title: '화분에 이름 붙이기',
    description: '키우는 화분마다 이름 붙여서 인스타에 일기 쓰기...',
    hashtags: ['#식물도친구', '#반려식물일기', '#그린루틴'],
    comment: "내 화분 이름은 '윙초'야. 안 부르면 시들어 🥹",
    votes: { yes: 42, maybe: 28, no: 5 },
    likes: 51,
    comments: 14,
    time: '3일',
    faded: false,
  },
  {
    id: 'seed-2',
    categoryLabel: '🍳 푸드',
    categoryClass: 'cafe',
    title: '새벽 1시 라면 일지',
    description: '새벽에 끓이는 라면 ASMR 모음...',
    hashtags: ['#새벽라면', '#심야ASMR'],
    comment: '새벽 라면 냄새가 이렇게 유혹적일 줄이야 😮',
    votes: { yes: 31, maybe: 19, no: 3 },
    likes: 28,
    comments: 7,
    time: '5일',
    faded: true,
  },
];

const USAGE_STEPS = [
  {
    num: '1',
    title: '트렌드 아이디어를 한 줄로 입력해',
    sub: '"할머니 패션", "마라탕 ASMR" 같은 거',
    gold: false,
  },
  {
    num: '2',
    title: '윙글이가 3가지 방향으로 다듬어줘',
    sub: '해시태그, 챌린지명, 첫 3초 후킹 아이디어까지',
    gold: false,
  },
  {
    num: '3',
    title: '잘 되면 윙글이가 SNS에 직접 올려줘 🌟',
    sub: '주간 TOP 3 = 윙글이의 인스타·틱톡 콘텐츠',
    gold: true,
  },
];

export default function EmptyFeed({ type, onCreateIdea, onClearSearch, onRetry, searchQuery, errorCode }: Props) {
  if (type === 'error') {
    return (
      <div className="empty-state">
        <div className="empty-state__icon empty-state__icon--error">📡</div>
        <p className="empty-state__title">윙글이가 잠깐 멍 때렸어 💀</p>
        <p className="empty-state__desc">
          피드를 못 가져왔어. 인터넷 확인하고<br />한 번만 더 시도해줄래?
        </p>
        <button className="empty-btn empty-btn--primary" onClick={onRetry}>🔄 다시 시도</button>
        {errorCode && <p className="empty-error-code">에러 코드: {errorCode}</p>}
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="empty-state">
        {searchQuery && (
          <div className="empty-filter-chip">
            <span>"{searchQuery}" 검색 중</span>
            <button onClick={onClearSearch} aria-label="검색 지우기">×</button>
          </div>
        )}
        <div className="empty-state__icon">🦊</div>
        <p className="empty-state__title">이 조건에 맞는 게 없네 🤔</p>
        <p className="empty-state__desc">
          검색 결과가 없어.<br />직접 아이디어를 올려볼래?
        </p>
        <button className="empty-btn empty-btn--primary" onClick={onCreateIdea}>
          + 첫 아이디어 만들기
        </button>
        <button className="empty-btn empty-btn--ghost" onClick={onClearSearch}>
          전체 보기
        </button>
      </div>
    );
  }

  return (
    <div className="empty-new-user">
      {/* 환영 카드 */}
      <div className="welcome-card">
        <div className="welcome-card__avatar">W</div>
        <p className="welcome-card__title">처음 왔구나! 반가워 🥹</p>
        <p className="welcome-card__desc">
          유행을 따라가지 말고, 직접 만들어봐.<br />
          네 아이디어를 윙글이가 3가지 방향으로 다듬어줄게.
        </p>
        <button className="welcome-card__cta" onClick={onCreateIdea}>
          <span>✨ 첫 아이디어 만들기</span>
          <span className="welcome-card__bonus">+20pt</span>
        </button>
        <p className="welcome-card__hint">첫 등록만 +20pt 보너스 · 보통 1분 안 걸려</p>
      </div>

      {/* 시딩 구분선 */}
      <div className="seeding-divider">
        <span>아직 다른 아이디어가 없어. 윙글이가 먼저 올려둔 거 구경해볼래? ↓</span>
      </div>

      {/* 시딩 카드들 (정적 미리보기) */}
      {SEEDING_CARDS.map((card) => (
        <article
          key={card.id}
          className={`trend-card${card.faded ? ' seeding-card--faded' : ''}`}
        >
          <div className="card-meta">
            <span className={`cat-badge cat-badge--${card.categoryClass}`}>{card.categoryLabel}</span>
            <span className="card-author seeding-author">@윙글이 · 🦊✨ 트윙글</span>
            <span className="seeding-badge">시딩</span>
            <span className="card-time">{card.time}</span>
          </div>
          <div className="trend-body">
            <h2 className="trend-title">{card.title}</h2>
            <p className="trend-desc">{card.description}</p>
          </div>
          {card.hashtags.length > 0 && (
            <div className="hashtag-row">
              {card.hashtags.map((h) => (
                <span key={h} className="hashtag-chip">{h}</span>
              ))}
            </div>
          )}
          <div className="wingle-comment-box">
            <img src="/wingle-3d.png" alt="윙글이" className="wingle-avatar-sm" />
            <p className="wingle-comment-text">{card.comment}</p>
          </div>
          <div className="vote-section">
            <div className="vote-buttons">
              <div className="vote-btn">🔥 해볼래 <span className="vote-btn-count">{card.votes.yes}</span></div>
              <div className="vote-btn">👀 보는중 <span className="vote-btn-count">{card.votes.maybe}</span></div>
              <div className="vote-btn">🤔 글쎄 <span className="vote-btn-count">{card.votes.no}</span></div>
            </div>
          </div>
          <div className="card-action-bar">
            <span className="seeding-action-item">🤍 <span className="card-action-like-count">{card.likes}</span></span>
            <span className="seeding-action-item">💬 <span className="card-action-comment-count">{card.comments}</span></span>
            <span className="seeding-action-share">🔗 공유</span>
          </div>
          {card.faded && (
            <p className="seeding-scroll-hint">아래로 스크롤하면 더 있어 ↓</p>
          )}
        </article>
      ))}

      {/* 사용법 3줄 요약 */}
      <div className="usage-hint">
        <p className="usage-hint__title">💡 Twing 사용법 3줄 요약</p>
        <div className="usage-hint__steps">
          {USAGE_STEPS.map((step) => (
            <div key={step.num} className="usage-step">
              <div className={`usage-step__num${step.gold ? ' usage-step__num--gold' : ''}`}>
                {step.num}
              </div>
              <div>
                <p className="usage-step__title">{step.title}</p>
                <p className="usage-step__sub">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
