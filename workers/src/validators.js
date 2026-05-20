import { CATEGORY_KEY_SET } from './constants/categories.js';

export function validateStrictA(data) {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.detected_flavor !== 'string' || !data.detected_flavor) return false;
  if (typeof data.inferred_differentiator !== 'string' || !data.inferred_differentiator) return false;
  if (!CATEGORY_KEY_SET.has(data.category)) return false;
  if (!Array.isArray(data.variants) || data.variants.length !== 3) return false;
  for (const v of data.variants) {
    if (!v.angle || !v.challenge_name) return false;
    if (!Array.isArray(v.hashtags) || v.hashtags.length === 0) return false;
    if (!v.wingle_comment || !v.caption_hook || !v.variation_seed) return false;
  }
  return true;
}

// strict 실패 후 1회 재호출 전 소프트 체크 — variants 배열이 있으면 재시도 가치 있음
export function validateSoftA(data) {
  return Array.isArray(data?.variants) && data.variants.length > 0;
}

export function validateStrictB(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.why_it_works?.core_mechanism) return false;
  if (!Array.isArray(data.why_it_works?.similar_success)) return false;
  const pp = data.platform_plans;
  if (!pp?.tiktok || !pp?.instagram_reels || !pp?.youtube_shorts) return false;
  if (!data.recommended_platform) return false;
  const sp = data.scale_playbook;
  if (!['ugc_expansion', 'series_expansion', 'hybrid'].includes(sp?.type)) return false;
  if (!sp.stage_1 || !sp.stage_2 || !sp.stage_3 || !sp.stage_4) return false;
  if (typeof data.why_it_might_fail?.saturation_risk !== 'number') return false;
  if (!Array.isArray(data.why_it_might_fail?.outdated_patterns)) return false;
  if (!data.how_to_win?.differentiator) return false;
  if (!Array.isArray(data.how_to_win?.pitfalls_to_avoid)) return false;
  if (!data.wingle_honest_verdict?.one_liner) return false;
  if (typeof data.wingle_honest_verdict?.score !== 'number') return false;
  return true;
}
