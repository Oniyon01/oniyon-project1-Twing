import type { VoteType } from '../types';

interface Props {
  voted: VoteType | null;
  votes: { yes: number; no: number; maybe: number };
  onVote: (type: VoteType) => void;
  isOwnCard?: boolean;
  hotScoreValue?: number;
}

const OPTIONS: { type: VoteType; emoji: string; label: string }[] = [
  { type: 'yes',   emoji: '🔥', label: '해볼래' },
  { type: 'maybe', emoji: '👀', label: '구경할래' },
  { type: 'no',    emoji: '🤔', label: '글쎄' },
];

export default function VoteButtons({ voted, votes, onVote, isOwnCard, hotScoreValue }: Props) {
  if (isOwnCard) {
    return (
      <div className="vote-stats-grid">
        {OPTIONS.map(({ type, emoji, label }) => (
          <div key={type} className="vote-stat-col">
            <div className="vote-stat-num">{emoji} {votes[type]}</div>
            <div className="vote-stat-label">{label}</div>
          </div>
        ))}
        <div className="vote-stat-col">
          <div className="vote-stat-num vote-stat-num--hot">▲ {hotScoreValue ?? 0}</div>
          <div className="vote-stat-label">핫점수</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-buttons">
      {OPTIONS.map(({ type, emoji, label }) => (
        <button
          key={type}
          className={`vote-btn${voted === type ? ' vote-btn--on' : ''}`}
          onClick={() => onVote(type)}
        >
          {emoji} {label} <span className="vote-btn-count">{votes[type]}</span>
        </button>
      ))}
    </div>
  );
}
