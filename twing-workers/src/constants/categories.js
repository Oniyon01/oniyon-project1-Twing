/**
 * Twing 카테고리 상수
 *
 * 워커 프롬프트, 검증기, (그리고 추후 클라이언트도)
 * 모두 이 파일에서 import해서 사용해야 함.
 *
 * 카테고리 추가/수정 시 이 파일만 수정.
 *
 * 결정 배경:
 * - 방향 A (TikTok 플레이버 기반) 채택
 * - 한국 MZ 트렌드 흐름과 SNS 분류 글로벌 표준 절충
 * - "기타" 카테고리는 의도적으로 제외 (AI가 게으르게 분류하는 것 방지)
 */

/**
 * 카테고리 메타데이터 — 한글 라벨, 이모지, 색상, 의미 설명
 *
 * 색상은 Twing 디자인 시스템의 c-{name} 램프와 1:1 매핑.
 * 클라이언트의 theme/colors 모듈에서도 같은 키 사용.
 */
export const CATEGORIES = [
  {
    key: "갓생",        // 워커가 응답에 넣는 정확한 한글 문자열
    emoji: "🌅",
    color: "amber",
    description: "자기관리·루틴·성장",
    examples: ["새벽 5시 기상 일지", "헬창 식단", "모닝 루틴"],
  },
  {
    key: "힐링",
    emoji: "🛁",
    color: "teal",
    description: "위안·평온·자기돌봄",
    examples: ["비 오는 날 ASMR", "솔로 카페", "느린 일상"],
  },
  {
    key: "컬처",
    emoji: "🎨",
    color: "purple",
    description: "K-pop·서브컬처·예술·덕질",
    examples: ["아이돌 덕질 정리", "인디 음악 발굴", "전시 후기"],
  },
  {
    key: "일상",
    emoji: "📝",
    color: "gray",
    description: "진짜 이야기·기록·관찰",
    examples: ["출근길 관찰", "직장인 점심", "오늘의 멍 때림"],
  },
  {
    key: "푸드",
    emoji: "🍜",
    color: "coral",
    description: "음식·요리·먹방",
    examples: ["마라탕 ASMR", "편의점 신상", "혼밥 오마카세"],
  },
  {
    key: "스타일",
    emoji: "💎",
    color: "pink",
    description: "패션·뷰티·인테리어",
    examples: ["할머니 옷장", "Y2K 코디", "미니멀 인테리어"],
  },
  {
    key: "테크",
    emoji: "🤖",
    color: "blue",
    description: "AI·디지털·앱·신기술",
    examples: ["AI 아바타", "ChatGPT 활용법", "신규 앱 리뷰"],
  },
  {
    key: "펫",
    emoji: "🐾",
    color: "green",
    description: "반려동물·동물 콘텐츠",
    examples: ["냥냥 일기", "산책 vlog", "이종 친구 챌린지"],
  },
  {
    key: "게임",
    emoji: "🎮",
    color: "red",
    description: "게임·e스포츠·게임 캐릭터",
    examples: ["랜덤 게임 도전", "캐릭터 코스프레", "게임 일지"],
  },
  {
    key: "유머",
    emoji: "💀",
    color: "humor",     // 별도 컬러 — 디자인 단계에서 별색 정의 (회보라 톤 권장)
    description: "밈·개그·웃긴 관찰",
    examples: ["헛소리 챌린지", "직장인 짤", "자학 개그"],
  },
];

/**
 * 검증 및 enum 강제용 — key만 뽑은 배열
 * Set으로 변환해서 O(1) 검사 가능
 */
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
export const CATEGORY_KEY_SET = new Set(CATEGORY_KEYS);

/**
 * 프롬프트 안에 박을 enum 문자열
 * "갓생 | 힐링 | 컬처 | 일상 | ..." 형태
 */
export const CATEGORY_ENUM_FOR_PROMPT = CATEGORY_KEYS.join(" | ");

/**
 * 프롬프트 안에 박을 가이드 텍스트
 * AI에게 카테고리별 설명+예시 알려줘서 분류 정확도 높임
 */
export const CATEGORY_GUIDE_FOR_PROMPT = CATEGORIES
  .map((c) => `  - ${c.key} ${c.emoji}: ${c.description} (예: ${c.examples.slice(0, 2).join(", ")})`)
  .join("\n");

/**
 * 클라이언트에서 카테고리 key로 메타데이터 조회용
 */
export function getCategoryMeta(key) {
  return CATEGORIES.find((c) => c.key === key) || null;
}
