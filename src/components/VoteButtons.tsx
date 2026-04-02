import type { VoteType } from '../types';

interface Props {
  voted: VoteType | null;
  votes: { yes: number; no: number; maybe: number };
  onVote: (type: VoteType) => void;
}

export default function VoteButtons({ voted, votes, onVote }: Props) {
  const total = votes.yes + votes.no + votes.maybe;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  return (
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
          <button className="vote-btn yes" onClick={() => onVote('yes')}>👍 맞다</button>
          <button className="vote-btn no" onClick={() => onVote('no')}>👎 아니다</button>
          <button className="vote-btn maybe" onClick={() => onVote('maybe')}>🤔 모르겠다</button>
        </div>
      )}
    </div>
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
