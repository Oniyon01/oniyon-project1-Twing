// 클라이언트 src/theme/categories.ts와 key 1:1 동일
export const CATEGORIES = ['갓생', '힐링', '컬처', '일상', '푸드', '스타일', '테크', '펫', '게임', '유머'];
export const CATEGORY_KEY_SET = new Set(CATEGORIES);
export const CATEGORY_ENUM_FOR_PROMPT = CATEGORIES.join(' | ');
