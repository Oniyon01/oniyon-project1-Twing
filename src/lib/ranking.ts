import type { Trend } from '../types';

// PRD 8.1 핫 점수 공식
// baseScore = tryVotes*5 + watchVotes*1 + views*0.1
// (likes/feedbacks/comments는 별도 DB 컬럼 추가 전까지 근사치 사용)
export function hotScore(trend: Trend, categoryMultiplier = 1.0): number {
  const tryVotes  = trend.votes.yes;
  const watchVotes = trend.votes.maybe;
  const hoursAgo = (Date.now() - new Date(trend.created_at).getTime()) / (1000 * 60 * 60);
  const baseScore = tryVotes * 5 + watchVotes * 1 + (trend.views ?? 0) * 0.1;
  return Math.round((baseScore * categoryMultiplier) / Math.pow(hoursAgo + 2, 2) * 100) / 100;
}

// 전체 기간 누적 반응 점수 (명예전당·주간)
export function totalScore(trend: Trend): number {
  return trend.votes.yes * 5 + trend.votes.maybe * 1;
}

// 이번 주 월요일 0시 기준 필터
export function isThisWeek(trend: Trend): boolean {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return new Date(trend.created_at).getTime() >= monday.getTime();
}

// 오늘 0시 이후
export function isToday(trend: Trend): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(trend.created_at).getTime() >= today.getTime();
}

// ─── 등급 시스템 (PRD 8.2) ─────────────────────────────────────────

export interface Grade {
  level: number;
  name: string;
  icon: string;
  parts: string;
  story: string;
  minPts: number;
  nextPts: number | null;
}

export const GRADES: Grade[] = [
  { level: 1, name: '트린이',  icon: '😶‍🌫️',   parts: '',                  story: '윙글이 세계에 막 발을 들인 새싹. 아직 실루엣만 존재.',         minPts: 0,      nextPts: 300   },
  { level: 2, name: '윙눈이',  icon: '👁️',     parts: '👁️',                story: '윙글이의 보라 눈동자가 처음으로 너를 향했다.',                  minPts: 300,    nextPts: 1200  },
  { level: 3, name: '윙이어',  icon: '👂',     parts: '👁️ 👂',             story: '윙글이 귀가 쫑긋 섰다. 네 아이디어를 듣고 있어.',              minPts: 1200,   nextPts: 4000  },
  { level: 4, name: '윙터치',  icon: '🌸',     parts: '👁️ 👂 🌸',          story: '윙글이 볼에 핑크 볼터치가 번진다. 설레이기 시작한 거야.',       minPts: 4000,   nextPts: 10000 },
  { level: 5, name: '골드윙',  icon: '🪽',     parts: '👁️ 👂 🌸 🪽',       story: '골드 날개를 건네줬다. 이제 같이 날 수 있다는 인정.',            minPts: 10000,  nextPts: 30000 },
  { level: 6, name: '트윙글',  icon: '🦊✨',   parts: '🦊✨ 👑',            story: '외형도, 감각도, 영혼까지. 윙글이의 쌍둥이가 됐다.',             minPts: 30000,  nextPts: null  },
];

export function getGrade(points: number): Grade {
  for (let i = GRADES.length - 1; i >= 0; i--) {
    if (points >= GRADES[i].minPts) return GRADES[i];
  }
  return GRADES[0];
}

export function gradeProgress(points: number): number {
  const grade = getGrade(points);
  if (!grade.nextPts) return 100;
  const range = grade.nextPts - grade.minPts;
  const earned = points - grade.minPts;
  return Math.min(100, Math.round((earned / range) * 100));
}

// ─── 포인트 정의 (PRD 8.2) ─────────────────────────────────────────

export const POINT_TABLE = [
  { action: '아이디어 등록',           pts: 10,  limit: '5개/일'     },
  { action: '아이디어 50자 이상',       pts: 5,   limit: '등록 시 자동' },
  { action: '구조화 피드백 작성',       pts: 5,   limit: '10개/일'    },
  { action: '자유 댓글 작성',           pts: 2,   limit: '20개/일'    },
  { action: '내 아이디어 좋아요 1개당', pts: 2,   limit: '본인 제외'  },
  { action: '내 아이디어 피드백 1개당', pts: 3,   limit: '—'         },
  { action: '커뮤니티 공유 완료',       pts: 8,   limit: '아이디어당 1회' },
  { action: '3일 연속 접속',           pts: 15,  limit: '—'         },
  { action: '7일 연속 접속',           pts: 30,  limit: '7일차 1회'  },
  { action: '윙글이 픽 선정',          pts: 50,  limit: '—'         },
  { action: 'SNS 콘텐츠화',           pts: 100, limit: '—'         },
  { action: '첫 아이디어 등록',        pts: 20,  limit: '최초 1회'   },
  { action: '첫 피드백 남기기',        pts: 10,  limit: '최초 1회'   },
] as const;

// ─── 스트릭 (localStorage) ─────────────────────────────────────────

const STREAK_KEY = 'twing_streak';
const STREAK_DATE_KEY = 'twing_streak_date';

export interface Streak {
  days: number;
  lastDate: string; // YYYY-MM-DD
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getStreak(): Streak {
  const days = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
  const lastDate = localStorage.getItem(STREAK_DATE_KEY) ?? '';
  return { days, lastDate };
}

export function checkAndUpdateStreak(): Streak {
  const today = todayStr();
  const streak = getStreak();

  if (streak.lastDate === today) return streak;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newDays = streak.lastDate === yesterday ? streak.days + 1 : 1;

  localStorage.setItem(STREAK_KEY, String(newDays));
  localStorage.setItem(STREAK_DATE_KEY, today);
  return { days: newDays, lastDate: today };
}

// ─── 뱃지 localStorage 헬퍼 ────────────────────────────────────────

const BADGES_KEY = 'twing_earned_badges';

export function getEarnedBadgeIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BADGES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function toggleBadge(id: string): string[] {
  const current = getEarnedBadgeIds();
  const next = current.includes(id)
    ? current.filter((b) => b !== id)
    : [...current, id];
  localStorage.setItem(BADGES_KEY, JSON.stringify(next));
  return next;
}

// ─── 뱃지 시스템 (PRD 8.4) ─────────────────────────────────────────

export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'pioneer',     icon: '🦅', name: '선구자',       desc: '초기 100명 이내 가입'             },
  { id: 'first_pick',  icon: '🌟', name: '첫 윙글이 픽', desc: '윙글이 픽 최초 선정'              },
  { id: 'creator',     icon: '⚡', name: '연쇄 창작자',  desc: '아이디어 10개 이상 등록'          },
  { id: 'talker',      icon: '💬', name: '소통왕',       desc: '피드백 50개 이상 작성'            },
  { id: 'viral',       icon: '🚀', name: '바이럴 메이커', desc: '아이디어 좋아요 100개 돌파'       },
  { id: 'sns_star',    icon: '📱', name: 'SNS 스타',     desc: '내 아이디어 SNS 콘텐츠화'         },
  { id: 'prophet',     icon: '🔮', name: '트렌드 예언자', desc: '내 아이디어가 실제 SNS 트렌드가 됨' },
];

const STREAK_STEPS = [
  { day: 1, icon: '🌱', pts: 5  },
  { day: 2, icon: '🌿', pts: 8  },
  { day: 3, icon: '🌳', pts: 15 },
  { day: 4, icon: '⭐', pts: 10 },
  { day: 5, icon: '⭐', pts: 10 },
  { day: 6, icon: '⭐', pts: 10 },
  { day: 7, icon: '🔥', pts: 30 },
];

export function getStreakSteps() { return STREAK_STEPS; }
