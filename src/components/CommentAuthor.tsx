import { getGrade, ALL_BADGES, getEarnedBadgeIds } from '../lib/ranking';
import './CommentAuthor.css';

interface Props {
  nickname: string | null;
  avatarUrl: string | null;
  userId: string | null;
  currentUserId?: string;
  /** grade_level stored in profile (future backend integration) */
  profileGradeLevel?: number | null;
  /** earned badge ids stored in profile (future backend integration) */
  earnedBadgeIds?: string[];
}

const MOCK_POINTS_KEY = 'twing_mock_pts';

export default function CommentAuthor({
  nickname,
  avatarUrl,
  userId,
  currentUserId,
  profileGradeLevel,
  earnedBadgeIds = [],
}: Props) {
  const isMe = !!userId && userId === currentUserId;

  const grade = (() => {
    if (isMe) {
      const pts = parseInt(localStorage.getItem(MOCK_POINTS_KEY) ?? '0', 10);
      return getGrade(pts);
    }
    if (profileGradeLevel) {
      const found = [1,2,3,4,5,6].find((l) => l === profileGradeLevel);
      if (found) return getGrade(found === 1 ? 0 : found === 2 ? 300 : found === 3 ? 1200 : found === 4 ? 4000 : found === 5 ? 10000 : 30000);
    }
    return getGrade(0); // 기본 Lv.1 트린이
  })();

  // 본인 댓글이면 localStorage에서 실제 획득 뱃지 읽기
  const resolvedBadgeIds = isMe ? getEarnedBadgeIds() : earnedBadgeIds;
  const earnedBadges = ALL_BADGES.filter((b) => resolvedBadgeIds.includes(b.id));
  const initials = (nickname || '?')[0].toUpperCase();

  return (
    <div className="ca-row">
      {/* 아바타 */}
      <div className="ca-avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={nickname ?? ''} className="ca-avatar-img" />
        ) : (
          <div className="ca-avatar-placeholder">{initials}</div>
        )}
      </div>

      {/* 닉네임 + 등급 + 뱃지 */}
      <div className="ca-meta">
        <div className="ca-name-row">
          <span className="ca-nickname">{nickname || '익명'}</span>

          {/* 등급 칩 */}
          <span className="ca-grade-chip">
            <span className="ca-grade-icon">{grade.icon}</span>
            <span className="ca-grade-name">Lv.{grade.level} {grade.name}</span>
            <span className="ca-tooltip ca-tooltip--grade">
              <strong>{grade.icon} Lv.{grade.level} {grade.name}</strong>
              <span>{grade.story}</span>
            </span>
          </span>

          {/* 뱃지 (획득한 것만) */}
          {earnedBadges.map((b) => (
            <span key={b.id} className="ca-badge-chip">
              {b.icon}
              <span className="ca-tooltip">
                <strong>{b.icon} {b.name}</strong>
                <span>{b.desc}</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
