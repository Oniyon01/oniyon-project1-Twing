// ─── Idea Creation Flow ───────────────────────────────────

export type EmotionTone = '웃김' | '멋짐' | '공감' | '충격' | '호기심';
export type ParticipationType = '챌린지' | '도전형' | '관전형';

export interface IdeaInput {
  core_idea: string;
  emotion_tone: EmotionTone;
  participation: ParticipationType;
  differentiator: string;
  reference?: string;
}

export interface Variant {
  angle: string;
  challenge_name: string;
  hashtags: string[];
  wingle_comment: string;
  caption_hook: string;
  variation_seed: string;
}

export interface VariantsResult {
  idea_id: string;
  detected_flavor: string;
  inferred_differentiator: string;
  variants: Variant[];
}

export interface ScalePlaybook {
  type: 'ugc_expansion' | 'series_expansion' | 'hybrid';
  stage_1: string;
  stage_2: string;
  stage_3: string;
  stage_4: string;
}

export interface DeepAnalysis {
  idea_id: string;
  why_it_works: {
    core_mechanism: string;
    similar_success: Array<{ name: string; year: number; scale: string }>;
  };
  platform_plans: {
    tiktok: { priority: string; core_tactic: string; first_3_seconds: string; loop_point: string; search_keywords: string[]; best_timing: string };
    instagram_reels: { priority: string; core_tactic: string; alt_text_suggestion: string; format_choice: string; best_timing: string };
    youtube_shorts: { priority: string; core_tactic: string; title_formula: string; thumbnail_concept: string; best_timing: string };
  };
  recommended_platform: string;
  scale_playbook: ScalePlaybook;
  why_it_might_fail: {
    saturation_risk: number;
    outdated_patterns: string[];
    execution_difficulty: string;
    ethical_note: string | null;
  };
  how_to_win: {
    differentiator: string;
    pitfalls_to_avoid: string[];
  };
  wingle_honest_verdict: {
    score: number;
    one_liner: string;
  };
}

// ─── Feed / Community ─────────────────────────────────────

export interface Trend {
  id: string;
  title: string;
  hashtag: string;
  description: string;
  image_url: string;
  ai_comment: string;
  created_at: string;
  category: Category;
  views: number;
  votes: {
    yes: number;
    no: number;
    maybe: number;
  };
  likes_count?: number;
  hot_score?: number;
  is_seed?: boolean;
  user_id?: string;
  author_nickname?: string;
  author_points?: number;
  author_avatar_url?: string;
  is_pick_candidate?: boolean;
  hashtags?: string[];
  variant_angle?: string;
  author_note?: string;
}

export type VoteType = 'yes' | 'no' | 'maybe';

import type { Category, CategoryMeta } from '../theme/categories';
export type { Category, CategoryMeta };

export interface Comment {
  id: string;
  trend_id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  nickname: string | null;
  avatar_url: string | null;
}
