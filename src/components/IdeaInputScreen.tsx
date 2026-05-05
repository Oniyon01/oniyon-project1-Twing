import { useState, useEffect } from 'react';
import type { IdeaInput, EmotionTone, ParticipationType } from '../types';
import './IdeaInputScreen.css';

interface Props {
  onSubmit: (input: IdeaInput) => Promise<void>;
  onDemo: () => void;
  onBack: () => void;
}

const LOADING_MESSAGES = [
  '아이디어 분석 중... 🔍',
  '트렌드 감각 발동 중... 🔥',
  '윙글이가 골몰히 생각 중... 🤔',
  '최적의 방향 찾는 중... ✨',
  '거의 다 됐어... 💡',
];

const EMOTION_OPTIONS: { value: EmotionTone; label: string }[] = [
  { value: '웃김',   label: '😄 웃기고 싶어' },
  { value: '공감',   label: '🫂 공감 받고 싶어' },
  { value: '충격',   label: '😱 충격 주고 싶어' },
  { value: '호기심', label: '👀 호기심 자극' },
  { value: '멋짐',   label: '😎 멋지게 보이고 싶어' },
];

const PARTICIPATION_OPTIONS: { value: ParticipationType; label: string; desc: string }[] = [
  { value: '챌린지', label: '🔥 챌린지',    desc: '다른 사람도 따라할 수 있게' },
  { value: '관전형', label: '👁️ 관전형',   desc: '보는 재미 위주' },
  { value: '도전형', label: '💪 도전형',    desc: '내가 직접 도전하는 형태' },
];

export default function IdeaInputScreen({ onSubmit, onDemo, onBack }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [coreIdea, setCoreIdea] = useState('');
  const [emotionTone, setEmotionTone] = useState<EmotionTone | ''>('');
  const [participation, setParticipation] = useState<ParticipationType | ''>('');
  const [differentiator, setDifferentiator] = useState('');
  const [aiJudge, setAiJudge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [isLoading]);

  function handleDiffInput(val: string) {
    setDifferentiator(val);
    if (val.trim()) setAiJudge(false);
  }

  function handleAiJudge() {
    setAiJudge(true);
    setDifferentiator('');
  }

  async function handleSubmit() {
    if (!emotionTone || !participation) return;
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit({
        core_idea: coreIdea.trim(),
        emotion_tone: emotionTone,
        participation,
        differentiator: aiJudge ? '' : differentiator.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '윙글이가 잠깐 멈췄어. 다시 시도해봐.');
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = !!emotionTone && !!participation && !isLoading;

  if (step === 0) {
    return (
      <div className="idea-screen">
        <div className="idea-header">
          <button className="idea-back-btn" onClick={onBack}>← 취소</button>
        </div>

        <div className="idea-step0-body">
          <img src="/wingle-3d.png" alt="윙글이" className="idea-wingle-hero" />
          <h1 className="idea-step0-title">어떤 트렌드 아이디어야?</h1>
          <p className="idea-step0-sub">윙글이가 3가지 방향으로 다듬어줄게 ✨</p>

          <div className="idea-textarea-wrap">
            <textarea
              className="idea-textarea"
              placeholder="예: 할머니 패션, 감성 분위기 카페, 직장인 일상 공유..."
              maxLength={200}
              value={coreIdea}
              onChange={(e) => setCoreIdea(e.target.value)}
              rows={4}
              autoFocus
            />
            <span className="idea-charcount">{coreIdea.length}/200</span>
          </div>

          <button
            className="idea-next-btn"
            disabled={coreIdea.trim().length < 2}
            onClick={() => setStep(1)}
          >
            다음으로 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="idea-screen">
      <div className="idea-header">
        <button className="idea-back-btn" onClick={() => setStep(0)}>← 뒤로</button>
      </div>

      <div className="idea-step1-body">
        {/* 윙글이 말풍선 */}
        <div className="idea-bubble-wrap">
          <img src="/wingle.png" alt="윙글이" className="idea-bubble-wingle" />
          <div className="idea-bubble">
            <p className="idea-bubble-text">
              3가지만 더 알려주면 훨씬 더 잘 뽑아줄게 👀
            </p>
          </div>
        </div>

        {/* Q1 — 감정 톤 */}
        <div className="idea-q-section">
          <div className="idea-q-header">
            <span className="idea-q-step">1/3</span>
            <p className="idea-q-label">어떤 감정으로 반응하길 바래?</p>
          </div>
          <div className="idea-chips">
            {EMOTION_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                className={`idea-chip${emotionTone === value ? ' selected' : ''}`}
                onClick={() => setEmotionTone(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 — 참여 구조 */}
        <div className="idea-q-section">
          <div className="idea-q-header">
            <span className="idea-q-step">2/3</span>
            <p className="idea-q-label">어떤 방식으로 참여하길 바래?</p>
          </div>
          <div className="idea-chips idea-chips--wide">
            {PARTICIPATION_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                className={`idea-chip idea-chip--wide${participation === value ? ' selected' : ''}`}
                onClick={() => setParticipation(value)}
              >
                <span className="idea-chip-label">{label}</span>
                <span className="idea-chip-desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Q3 — 독특한 포인트 (선택) */}
        <div className="idea-q-section">
          <div className="idea-q-header">
            <span className="idea-q-step">3/3</span>
            <span className="idea-q-optional">선택</span>
            <p className="idea-q-label">이 아이디어만의 독특한 포인트는?</p>
          </div>
          <textarea
            className={`idea-diff-textarea${aiJudge ? ' dimmed' : ''}`}
            placeholder="다른 비슷한 콘텐츠와 차별점을 적어줘 (없어도 돼)"
            rows={2}
            maxLength={100}
            value={differentiator}
            onChange={(e) => handleDiffInput(e.target.value)}
            disabled={aiJudge}
          />
          <button
            className={`idea-ai-judge-btn${aiJudge ? ' active' : ''}`}
            onClick={handleAiJudge}
          >
            🤖 윙글이가 알아서 판단
          </button>
        </div>

        {/* 하단 면책 */}
        <p className="idea-disclaimer">3가지 답이 다 없어도 돼</p>

        {/* 에러 */}
        {error && <p className="idea-error">{error}</p>}

        {/* CTA */}
        <button
          className="idea-submit-btn"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isLoading
            ? <span className="idea-loading-text">{LOADING_MESSAGES[loadingMsgIdx]}</span>
            : '🪽 윙글이에게 보내기'
          }
        </button>

        {/* 데모 버튼 */}
        <button className="idea-demo-btn" onClick={onDemo} disabled={isLoading}>
          🎮 데모로 결과 미리보기
        </button>
      </div>
    </div>
  );
}
