import { useState } from 'react';
import type { VariantsResult, IdeaInput, Variant } from '../types';
import './VariantsScreen.css';

interface Props {
  variantsResult: VariantsResult;
  ideaInput: IdeaInput;
  onSelect: (variantIndex: number, authorNote: string) => Promise<void>;
  onBack: () => void;
}

const ANGLE_COLORS = [
  'var(--c-variant-a)',
  'var(--c-variant-b)',
  'var(--c-variant-c)',
] as const;

export default function VariantsScreen({ variantsResult, ideaInput, onSelect, onBack }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [authorNote, setAuthorNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    if (selected === null) return;
    setIsLoading(true);
    setError(null);
    try {
      await onSelect(selected, authorNote.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : '윙글이가 잠깐 멈췄어. 다시 시도해봐.');
      setIsLoading(false);
    }
  }

  return (
    <div className="variants-screen">
      <div className="variants-header">
        <button className="idea-back-btn" onClick={onBack}>← 뒤로</button>
      </div>

      <div className="variants-body">
        {/* 상단 안내 */}
        <div className="variants-intro">
          <img src="/wingle-3d.png" alt="윙글이" className="variants-wingle" />
          <div>
            <h2 className="variants-title">3가지 방향을 뽑아줬어!</h2>
            <p className="variants-sub">하나를 골라봐. 피드에 공유하면 전략을 전부 알려줄게.</p>
          </div>
        </div>

        {/* 플레이버 & 차별점 */}
        <div className="variants-meta-row">
          <span className="variants-flavor-chip">{variantsResult.detected_flavor}</span>
          {variantsResult.inferred_differentiator && (
            <span className="variants-diff-note">
              독특한 포인트: {variantsResult.inferred_differentiator}
            </span>
          )}
        </div>

        {/* 원본 아이디어 */}
        <div className="variants-original">
          <span className="variants-original-label">내 아이디어</span>
          <span className="variants-original-text">"{ideaInput.core_idea}"</span>
        </div>

        {/* Variant 카드 3개 */}
        <div className="variants-list">
          {variantsResult.variants.map((v: Variant, i: number) => (
            <button
              key={i}
              className={`variant-card${selected === i ? ' selected' : ''}`}
              onClick={() => setSelected(i)}
              style={{ '--accent': ANGLE_COLORS[i] } as React.CSSProperties}
            >
              {/* 상단 헤더 */}
              <div className="variant-card-head">
                <span className="variant-num">{i + 1}</span>
                <span className="variant-angle">{v.angle}</span>
                {selected === i && <span className="variant-check">✓ 선택</span>}
              </div>

              {/* 챌린지명 */}
              <p className="variant-challenge">{v.challenge_name}</p>

              {/* 해시태그 */}
              <div className="variant-hashtags">
                {v.hashtags.map((tag) => (
                  <span key={tag} className="hashtag-chip small">{tag}</span>
                ))}
              </div>

              {/* 후킹 문구 */}
              <p className="variant-hook">"{v.caption_hook}"</p>

              {/* 윙글이 코멘트 */}
              <div className="variant-wingle-comment">
                <img src="/wingle.png" alt="" className="variant-wingle-icon" />
                <p>{v.wingle_comment}</p>
              </div>

              {/* variation_seed */}
              {v.variation_seed && (
                <p className="variant-seed">시리즈 변주: {v.variation_seed}</p>
              )}
            </button>
          ))}
        </div>

        {/* 작성자 한마디 */}
        {selected !== null && (
          <div className="variants-author-note-wrap">
            <label className="variants-author-note-label">
              ✏️ 작성자 한마디 <span className="variants-author-note-optional">(선택)</span>
            </label>
            <textarea
              className="variants-author-note-input"
              placeholder="이 아이디어를 떠올린 계기나 하고 싶은 말을 남겨봐..."
              value={authorNote}
              onChange={(e) => setAuthorNote(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
            />
            <span className="variants-author-note-count">{authorNote.length}/200</span>
          </div>
        )}

        {error && <p className="idea-error">{error}</p>}

        {/* CTA */}
        <button
          className="variants-unlock-btn"
          disabled={selected === null || isLoading}
          onClick={handleUnlock}
        >
          {isLoading
            ? '윙글이가 분석 중이야... ✨'
            : '🔓 피드에 공유하고 전략 잠금 해제'}
        </button>
        <p className="variants-share-note">공유하면 커뮤니티 피드에 등록되고 전략이 열려요</p>
      </div>
    </div>
  );
}
