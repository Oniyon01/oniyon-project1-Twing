/**
 * 클라이언트 카테고리 메타데이터
 * 워커의 src/constants/categories.js와 key가 1:1 동일해야 함.
 * 카테고리 추가/수정 시 이 파일과 워커 파일을 함께 수정.
 */

export type Category =
  | '갓생'
  | '힐링'
  | '컬처'
  | '일상'
  | '푸드'
  | '스타일'
  | '테크'
  | '펫'
  | '게임'
  | '유머';

export interface CategoryMeta {
  key: Category;
  emoji: string;
  color: string;       // text color — dark mode
  colorLight: string;  // text color — light mode (더 진한 색)
  bg: string;          // badge background (반투명, 양쪽 모드 공용)
  border: string;      // badge border
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: '갓생',
    emoji: '🌅',
    color: '#fcd34d',
    colorLight: '#92400e',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.28)',
    description: '자기관리·루틴·성장',
  },
  {
    key: '힐링',
    emoji: '🛁',
    color: '#5eead4',
    colorLight: '#0f766e',
    bg: 'rgba(20,184,166,0.15)',
    border: 'rgba(20,184,166,0.28)',
    description: '위안·평온·자기돌봄',
  },
  {
    key: '컬처',
    emoji: '🎨',
    color: '#d8b4fe',
    colorLight: '#6b21a8',
    bg: 'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.28)',
    description: 'K-pop·서브컬처·예술·덕질',
  },
  {
    key: '일상',
    emoji: '📝',
    color: '#94a3b8',
    colorLight: '#374151',
    bg: 'rgba(100,116,139,0.15)',
    border: 'rgba(100,116,139,0.28)',
    description: '진짜 이야기·기록·관찰',
  },
  {
    key: '푸드',
    emoji: '🍜',
    color: '#fdba74',
    colorLight: '#9a3412',
    bg: 'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.28)',
    description: '음식·요리·먹방',
  },
  {
    key: '스타일',
    emoji: '💎',
    color: '#f9a8d4',
    colorLight: '#9d174d',
    bg: 'rgba(236,72,153,0.15)',
    border: 'rgba(236,72,153,0.28)',
    description: '패션·뷰티·인테리어',
  },
  {
    key: '테크',
    emoji: '🤖',
    color: '#93c5fd',
    colorLight: '#1e40af',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.28)',
    description: 'AI·디지털·앱·신기술',
  },
  {
    key: '펫',
    emoji: '🐾',
    color: '#86efac',
    colorLight: '#166534',
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.28)',
    description: '반려동물·동물 콘텐츠',
  },
  {
    key: '게임',
    emoji: '🎮',
    color: '#fca5a5',
    colorLight: '#991b1b',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.28)',
    description: '게임·e스포츠·게임 캐릭터',
  },
  {
    key: '유머',
    emoji: '💀',
    color: '#9088B0',
    colorLight: '#4a3f72',
    bg: 'rgba(144,136,176,0.15)',
    border: 'rgba(144,136,176,0.28)',
    description: '밈·개그·웃긴 관찰',
  },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export function getCategoryMeta(key: string): CategoryMeta | null {
  return CATEGORIES.find((c) => c.key === key) ?? null;
}

/** 현재 테마에 맞는 텍스트 색상 반환 */
export function getCategoryColor(meta: CategoryMeta): string {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? meta.colorLight
    : meta.color;
}
