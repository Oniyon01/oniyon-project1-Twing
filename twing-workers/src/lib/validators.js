/**
 * 출력 검증 도구
 *
 * 두 종류로 분리:
 * - validateStrict: 강제 규칙 (위반 시 자동 재호출)
 * - validateSoft:   권장 패턴 (위반해도 통과, 로그만)
 *
 * 이 분리는 최종 프롬프트 문서의 5장 "강제 규칙 vs 권장 패턴" 그대로.
 */
import { CATEGORY_KEY_SET } from "../constants/categories.js";

// ─────────────────────────────────────────────────────────
// 프롬프트 A 검증
// ─────────────────────────────────────────────────────────

const A_LENGTH_LIMITS = {
  challenge_name: 12,
  wingle_comment: 40,
  caption_hook: 50,
  variation_seed: 40,
};

const A_REQUIRED_VARIANT_FIELDS = [
  "angle",
  "challenge_name",
  "hashtags",
  "wingle_comment",
  "caption_hook",
  "variation_seed",
];

/**
 * 프롬프트 A 출력 강제 검증
 * @returns {{ passed: boolean, errors: string[] }}
 */
export function validateStrictA(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== "object") {
    return { passed: false, errors: ["Output is not an object"] };
  }

  // 카테고리 검증 — 10개 enum 중 하나여야 함 (강제, 위반 시 재호출)
  if (typeof parsed.category !== "string") {
    errors.push("category 누락 또는 string 아님");
  } else if (!CATEGORY_KEY_SET.has(parsed.category)) {
    errors.push(`category가 enum 외 값: "${parsed.category}" (10개 카테고리 중 하나여야 함)`);
  }

  if (typeof parsed.detected_flavor !== "string") {
    errors.push("detected_flavor 누락 또는 string 아님");
  }
  if (typeof parsed.inferred_differentiator !== "string") {
    errors.push("inferred_differentiator 누락 또는 string 아님");
  }

  if (!Array.isArray(parsed.variants)) {
    errors.push("variants가 배열이 아님");
    return { passed: false, errors };
  }
  if (parsed.variants.length !== 3) {
    errors.push(`variants는 정확히 3개여야 함 (현재 ${parsed.variants.length})`);
  }

  parsed.variants.forEach((variant, idx) => {
    A_REQUIRED_VARIANT_FIELDS.forEach((field) => {
      if (!(field in variant)) {
        errors.push(`variant[${idx}] 필드 누락: ${field}`);
      }
    });

    // 글자수 체크
    Object.entries(A_LENGTH_LIMITS).forEach(([field, limit]) => {
      const value = variant[field];
      if (typeof value === "string" && value.length > limit) {
        errors.push(
          `variant[${idx}].${field} 글자수 초과: ${value.length}자 (제한 ${limit}자)`
        );
      }
    });

    // hashtags 검증 — 정확히 3개 + # 시작
    const tags = variant.hashtags;
    if (!Array.isArray(tags) || tags.length !== 3) {
      errors.push(`variant[${idx}].hashtags는 정확히 3개여야 함`);
    } else {
      tags.forEach((tag, tagIdx) => {
        if (typeof tag !== "string" || !tag.startsWith("#")) {
          errors.push(`variant[${idx}].hashtags[${tagIdx}] '#'으로 시작해야 함`);
        }
      });
    }
  });

  // angle 중복 체크
  const angles = parsed.variants.map((v) => v.angle).filter(Boolean);
  if (new Set(angles).size < angles.length) {
    errors.push("angle 중복 발견 (모두 달라야 함)");
  }

  return { passed: errors.length === 0, errors };
}

/**
 * 프롬프트 A 출력 권장 패턴 검증 — 위반해도 통과, 로그용
 */
export function validateSoftA(parsed, participation) {
  const warnings = [];
  if (!parsed?.variants) return { warnings };

  const CHALLENGE_VERBS = ["챌린지", "하기", "해보기", "해봄", "털기", "넣기", "입기", "차리기"];
  const SPECTATOR_NOUNS = ["일지", "일기", "아카이브", "스케이프", "북", "리스트", "컬렉션", "맵"];

  parsed.variants.forEach((variant, idx) => {
    const name = variant.challenge_name || "";

    if (participation === "챌린지") {
      const hasVerb = CHALLENGE_VERBS.some((p) => name.includes(p));
      if (!hasVerb) {
        warnings.push(`variant[${idx}].challenge_name='${name}' — 챌린지 카테고리지만 동사형 패턴 없음 (권장 패턴 위반, 통과)`);
      }
    } else if (participation === "관전형") {
      const hasNoun = SPECTATOR_NOUNS.some((p) => name.includes(p));
      if (!hasNoun) {
        warnings.push(`variant[${idx}].challenge_name='${name}' — 관전형이지만 명사형 시리즈 패턴 약함 (권장 패턴 위반, 통과)`);
      }
    }
  });

  return { warnings };
}

// ─────────────────────────────────────────────────────────
// 프롬프트 B 검증
// ─────────────────────────────────────────────────────────

const B_PRIORITY_VALUES = new Set(["high", "medium", "low"]);
const B_PLAYBOOK_TYPES = new Set(["ugc_expansion", "series_expansion", "hybrid"]);

/**
 * 프롬프트 B 출력 강제 검증
 */
export function validateStrictB(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== "object") {
    return { passed: false, errors: ["Output is not an object"] };
  }

  // why_it_works
  if (!parsed.why_it_works?.core_mechanism) {
    errors.push("why_it_works.core_mechanism 누락");
  }
  if (parsed.why_it_works?.core_mechanism?.length > 40) {
    errors.push(`why_it_works.core_mechanism 글자수 초과 (${parsed.why_it_works.core_mechanism.length} > 40)`);
  }

  // platform_plans
  const plans = parsed.platform_plans;
  if (!plans?.tiktok || !plans?.instagram_reels || !plans?.youtube_shorts) {
    errors.push("platform_plans에 tiktok/instagram_reels/youtube_shorts 모두 있어야 함");
  } else {
    const priorities = [
      plans.tiktok?.priority,
      plans.instagram_reels?.priority,
      plans.youtube_shorts?.priority,
    ];
    priorities.forEach((p, i) => {
      if (!B_PRIORITY_VALUES.has(p)) {
        errors.push(`platform priority[${i}] 잘못됨: ${p}`);
      }
    });
    // 모두 high 금지 (시스템 프롬프트의 강제 원칙)
    if (priorities.every((p) => p === "high")) {
      errors.push("3개 플랫폼 priority가 모두 high인 결과는 금지");
    }
  }

  // scale_playbook
  const pb = parsed.scale_playbook;
  if (!pb || !B_PLAYBOOK_TYPES.has(pb.type)) {
    errors.push(`scale_playbook.type 잘못됨: ${pb?.type}`);
  }
  ["stage_1", "stage_2", "stage_3", "stage_4"].forEach((stage) => {
    const v = pb?.[stage];
    if (typeof v !== "string" || v.length === 0) {
      errors.push(`scale_playbook.${stage} 누락`);
    } else if (v.length > 50) {
      errors.push(`scale_playbook.${stage} 글자수 초과 (${v.length} > 50)`);
    }
  });

  // verdict
  const score = parsed.wingle_honest_verdict?.score;
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    errors.push(`wingle_honest_verdict.score 1-10 정수가 아님: ${score}`);
  }
  const oneLiner = parsed.wingle_honest_verdict?.one_liner;
  if (typeof oneLiner !== "string" || oneLiner.length === 0) {
    errors.push("wingle_honest_verdict.one_liner 누락");
  } else if (oneLiner.length > 30) {
    errors.push(`wingle_honest_verdict.one_liner 글자수 초과 (${oneLiner.length} > 30)`);
  }

  // saturation_risk
  const sat = parsed.why_it_might_fail?.saturation_risk;
  if (!Number.isInteger(sat) || sat < 1 || sat > 10) {
    errors.push(`saturation_risk 1-10 정수가 아님: ${sat}`);
  }

  // pitfalls_to_avoid 3개
  const pitfalls = parsed.how_to_win?.pitfalls_to_avoid;
  if (!Array.isArray(pitfalls) || pitfalls.length !== 3) {
    errors.push(`pitfalls_to_avoid는 정확히 3개여야 함`);
  }

  return { passed: errors.length === 0, errors };
}
