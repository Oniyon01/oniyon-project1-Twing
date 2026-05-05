import { useEffect, useState } from 'react';
import {
  GRADES, getGrade, gradeProgress,
  checkAndUpdateStreak, getStreakSteps,
  ALL_BADGES, POINT_TABLE,
  getEarnedBadgeIds, toggleBadge,
} from '../lib/ranking';
import './GradeCard.css';

const MOCK_POINTS_KEY = 'twing_mock_pts';

export default function GradeCard() {
  const [points, setPoints] = useState(() =>
    parseInt(localStorage.getItem(MOCK_POINTS_KEY) ?? '0', 10)
  );
  const [streak, setStreak] = useState({ days: 0, lastDate: '' });
  const [showPointTable, setShowPointTable] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>(() => getEarnedBadgeIds());

  useEffect(() => {
    const s = checkAndUpdateStreak();
    setStreak(s);
  }, []);

  const grade = getGrade(points);
  const progress = gradeProgress(points);
  const nextGrade = GRADES.find((g) => g.level === grade.level + 1);
  const ptsToNext = nextGrade ? nextGrade.minPts - points : 0;

  const streakSteps = getStreakSteps();
  const currentStepIdx = ((streak.days - 1) % 7);

  function addDemoPoints(n: number) {
    const next = Math.max(0, points + n);
    setPoints(next);
    localStorage.setItem(MOCK_POINTS_KEY, String(next));
  }

  function handleToggleBadge(id: string) {
    setEarnedBadgeIds(toggleBadge(id));
  }

  return (
    <div className="grade-card">
      {/* 등급 헤더 */}
      <div className="grade-header">
        <div className="grade-icon-wrap">
          <span className="grade-icon">{grade.icon}</span>
          {grade.parts && <span className="grade-parts">{grade.parts}</span>}
        </div>
        <div className="grade-info">
          <div className="grade-name-row">
            <span className="grade-level">Lv.{grade.level}</span>
            <span className="grade-name">{grade.name}</span>
          </div>
          <p className="grade-story">{grade.story}</p>
        </div>
      </div>

      {/* 포인트 & 진척 바 */}
      <div className="grade-progress-wrap">
        <div className="grade-progress-row">
          <span className="grade-pts">{points.toLocaleString()} pt</span>
          {nextGrade && (
            <span className="grade-next-label">
              다음 등급까지 {ptsToNext.toLocaleString()} pt
            </span>
          )}
        </div>
        <div className="grade-bar-track">
          <div className="grade-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        {nextGrade && (
          <div className="grade-milestones">
            <span>{grade.name}</span>
            <span>{nextGrade.name} ({nextGrade.minPts.toLocaleString()} pt)</span>
          </div>
        )}
      </div>

      {/* 등급 로드맵 */}
      <div className="grade-roadmap">
        {GRADES.map((g) => (
          <div
            key={g.level}
            className={`roadmap-step${g.level <= grade.level ? ' reached' : ''}${g.level === grade.level ? ' current' : ''}`}
          >
            <span className="roadmap-icon">{g.icon}</span>
            <span className="roadmap-name">{g.name}</span>
          </div>
        ))}
      </div>

      {/* 스트릭 */}
      <div className="streak-section">
        <div className="streak-header">
          <span className="streak-title">🔥 출석 스트릭</span>
          <span className="streak-days">{streak.days}일 연속</span>
        </div>
        <div className="streak-steps">
          {streakSteps.map((step, i) => {
            const done = streak.days > 0 && i < (streak.days % 7 === 0 ? 7 : streak.days % 7);
            const current = i === currentStepIdx && streak.days > 0;
            return (
              <div key={i} className={`streak-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
                <span className="streak-step-icon">{step.icon}</span>
                <span className="streak-step-day">{i + 1}일</span>
                <span className="streak-step-pts">+{step.pts}</span>
              </div>
            );
          })}
        </div>
        <p className="streak-note">스트릭이 끊겨도 포인트는 절대 사라지지 않아요.</p>
      </div>

      {/* 뱃지 컬렉션 */}
      <div className="badge-section">
        <div className="badge-section-header">
          <p className="badge-title">🏅 뱃지 컬렉션</p>
          <span className="badge-earned-count">
            {earnedBadgeIds.length} / {ALL_BADGES.length} 획득
          </span>
        </div>
        <p className="badge-demo-hint">* 클릭해서 획득/반납 (데모)</p>
        <div className="badge-grid">
          {ALL_BADGES.map((b) => {
            const earned = earnedBadgeIds.includes(b.id);
            return (
              <button
                key={b.id}
                className={`badge-item${earned ? ' earned' : ' locked'}`}
                onClick={() => handleToggleBadge(b.id)}
                title={earned ? `${b.name} 반납` : `${b.name} 획득`}
              >
                <span className="badge-icon">{b.icon}</span>
                <span className="badge-name">{b.name}</span>
                <span className="badge-desc">{b.desc}</span>
                {earned && <span className="badge-earned-mark">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 포인트 획득 방법 */}
      <div className="point-table-section">
        <button className="point-table-toggle" onClick={() => setShowPointTable((v) => !v)}>
          💡 포인트 획득 방법 {showPointTable ? '닫기' : '보기'}
        </button>
        {showPointTable && (
          <table className="point-table">
            <thead>
              <tr>
                <th>활동</th>
                <th>포인트</th>
                <th>한도</th>
              </tr>
            </thead>
            <tbody>
              {POINT_TABLE.map((row) => (
                <tr key={row.action}>
                  <td>{row.action}</td>
                  <td>+{row.pts}</td>
                  <td>{row.limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 개발용 포인트 조절 (TODO: 실제 포인트 시스템으로 교체) */}
      <div className="demo-controls">
        <p className="demo-label">* 데모용 포인트 조절 (개발 중)</p>
        <div className="demo-btns">
          {[100, 500, 1000].map((n) => (
            <button key={n} className="demo-btn" onClick={() => addDemoPoints(n)}>+{n}</button>
          ))}
          <button className="demo-btn demo-btn--reset" onClick={() => addDemoPoints(-points)}>초기화</button>
        </div>
      </div>
    </div>
  );
}
