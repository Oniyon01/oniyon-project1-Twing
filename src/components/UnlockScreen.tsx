import type { DeepAnalysis, Variant, IdeaInput } from '../types';
import './UnlockScreen.css';

interface Props {
  deepAnalysis: DeepAnalysis;
  variant: Variant;
  ideaInput: IdeaInput; // reserved for future use (e.g. display original idea)
  onBack: () => void;
}

const PLAYBOOK_TYPE_LABEL: Record<string, string> = {
  ugc_expansion:    'UGC 확산형',
  series_expansion: '시리즈 확산형',
  hybrid:           '하이브리드',
};

const PRIORITY_LABEL: Record<string, { label: string; cls: string }> = {
  high:   { label: '최적', cls: 'priority--high' },
  medium: { label: '적합', cls: 'priority--med' },
  low:    { label: '낮음', cls: 'priority--low' },
};

const PLATFORM_LABELS: Record<string, { emoji: string; name: string }> = {
  tiktok:           { emoji: '🎵', name: '틱톡' },
  instagram_reels:  { emoji: '📸', name: '인스타 릴스' },
  youtube_shorts:   { emoji: '▶️', name: '유튜브 쇼츠' },
};

const STAGE_NAMES = ['시드', '초기 반응', '바이럴 진입', '확장'];

export default function UnlockScreen({ deepAnalysis: da, variant, onBack }: Props) {
  const { scale_playbook: pb } = da;
  const playbookTypeLabel = PLAYBOOK_TYPE_LABEL[pb.type] ?? pb.type;
  const stages = [pb.stage_1, pb.stage_2, pb.stage_3, pb.stage_4];

  return (
    <div className="unlock-screen">
      <div className="unlock-header">
        <button className="idea-back-btn" onClick={onBack}>← 뒤로</button>
      </div>

      <div className="unlock-body">
        {/* 잠금 해제 배너 */}
        <div className="unlock-banner">
          <span className="unlock-banner-icon">🔓</span>
          <div>
            <p className="unlock-banner-title">전략 잠금 해제!</p>
            <p className="unlock-banner-sub">윙글이의 분석이 완료됐어</p>
          </div>
        </div>

        {/* 선택된 아이디어 요약 */}
        <div className="unlock-variant-summary">
          <span className="unlock-variant-name">{variant.challenge_name}</span>
          <div className="unlock-variant-tags">
            {variant.hashtags.map((tag) => (
              <span key={tag} className="hashtag-chip small">{tag}</span>
            ))}
          </div>
        </div>

        {/* 윙글이 총평 */}
        <div className="unlock-verdict">
          <div className="unlock-verdict-score-wrap">
            <span className="unlock-verdict-score">{da.wingle_honest_verdict.score}</span>
            <span className="unlock-verdict-max">/10</span>
          </div>
          <div className="unlock-verdict-right">
            <p className="unlock-verdict-text">"{da.wingle_honest_verdict.one_liner}"</p>
            <p className="unlock-verdict-label">윙글이 솔직 총평</p>
          </div>
        </div>

        {/* 왜 터질 수 있는가 */}
        <div className="unlock-section">
          <h3 className="unlock-section-title">💡 왜 터질 수 있어</h3>
          <p className="unlock-mechanism">{da.why_it_works.core_mechanism}</p>
          {da.why_it_works.similar_success.length > 0 && (
            <div className="unlock-similar">
              <p className="unlock-similar-label">유사 성공 사례</p>
              <ul className="unlock-similar-list">
                {da.why_it_works.similar_success.map((s, i) => (
                  <li key={i} className="unlock-similar-item">
                    <span className="unlock-similar-name">{s.name}</span>
                    <span className="unlock-similar-meta">{s.year} · {s.scale}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 플랫폼 전략 */}
        <div className="unlock-section">
          <h3 className="unlock-section-title">📱 플랫폼 전략</h3>
          <p className="unlock-recommended">
            가장 먼저 올려야 할 플랫폼:&nbsp;
            <strong>{PLATFORM_LABELS[da.recommended_platform]?.name ?? da.recommended_platform}</strong>
          </p>
          <div className="platform-cards">
            {(Object.entries(da.platform_plans) as [string, { priority: string; core_tactic: string; best_timing: string }][]).map(([key, plan]) => {
              const p = PRIORITY_LABEL[plan.priority] ?? { label: plan.priority, cls: '' };
              const pl = PLATFORM_LABELS[key];
              return (
                <div key={key} className={`platform-card${plan.priority === 'high' ? ' platform-card--high' : ''}`}>
                  <div className="platform-card-head">
                    <span className="platform-card-name">{pl?.emoji} {pl?.name ?? key}</span>
                    <span className={`priority-badge ${p.cls}`}>{p.label}</span>
                  </div>
                  <p className="platform-card-tactic">{plan.core_tactic}</p>
                  <p className="platform-card-timing">⏰ {plan.best_timing}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 확산 플레이북 (V3 핵심 섹션) ─── */}
        <div className="playbook-section">
          <div className="playbook-header">
            <h3 className="playbook-title">🚀 확산 플레이북</h3>
            <span className={`playbook-type-badge playbook-type-badge--${pb.type}`}>
              {playbookTypeLabel}
            </span>
          </div>

          <div className="playbook-timeline">
            {stages.map((stageText, i) => {
              const isFinal = i === stages.length - 1;
              return (
                <div key={i}>
                  <div className="playbook-stage">
                    <div className={`playbook-dot${isFinal ? ' playbook-dot--final' : ''}`}>
                      {i + 1}
                    </div>
                    <div className={`playbook-stage-content${isFinal ? ' playbook-stage-content--final' : ''}`}>
                      <span className="playbook-stage-name">{STAGE_NAMES[i]}</span>
                      <p className="playbook-stage-desc">{stageText}</p>
                    </div>
                  </div>
                  {!isFinal && <div className="playbook-connector" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 실패할 수 있는 이유 */}
        <div className="unlock-section">
          <h3 className="unlock-section-title">⚠️ 조심해야 할 것들</h3>
          <div className="unlock-risk-row">
            <span className="unlock-risk-label">포화도 리스크</span>
            <div className="unlock-risk-bar-track">
              <div
                className="unlock-risk-bar-fill"
                style={{ width: `${da.why_it_might_fail.saturation_risk * 10}%` }}
              />
            </div>
            <span className="unlock-risk-score">{da.why_it_might_fail.saturation_risk}/10</span>
          </div>
          <p className="unlock-risk-difficulty">{da.why_it_might_fail.execution_difficulty}</p>
          {da.why_it_might_fail.outdated_patterns.length > 0 && (
            <div className="unlock-outdated">
              <p className="unlock-outdated-label">비슷한 지난 트렌드</p>
              <div className="unlock-outdated-chips">
                {da.why_it_might_fail.outdated_patterns.map((p) => (
                  <span key={p} className="unlock-outdated-chip">{p}</span>
                ))}
              </div>
            </div>
          )}
          {da.why_it_might_fail.ethical_note && (
            <p className="unlock-ethical">{da.why_it_might_fail.ethical_note}</p>
          )}
        </div>

        {/* 이기는 법 */}
        <div className="unlock-section">
          <h3 className="unlock-section-title">🏆 이렇게 하면 달라</h3>
          <div className="unlock-how-win-box">
            <p className="unlock-how-win-diff">{da.how_to_win.differentiator}</p>
          </div>
          <ul className="unlock-pitfalls">
            {da.how_to_win.pitfalls_to_avoid.map((p) => (
              <li key={p} className="unlock-pitfall-item">
                <span className="unlock-pitfall-icon">✕</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 하단 안내 */}
        <div className="unlock-footer">
          <p>커뮤니티에 공유됐어. 사람들의 반응을 기다려봐 ✨</p>
        </div>
      </div>
    </div>
  );
}
