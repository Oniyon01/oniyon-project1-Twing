/**
 * POST /api/generate-variants
 *
 * 유저가 입력 화면에서 "윙글이에게 보내기"를 누르면 호출됨.
 * 프롬프트 A를 호출해서 variants 3개 생성, DB 저장, 응답.
 *
 * 흐름:
 *   1. 입력 검증 (필수 필드, 길이)
 *   2. 프롬프트 A 호출
 *   3. JSON 파싱 + strict 검증
 *   4. 실패 시 1회 재호출
 *   5. 성공 시 DB에 저장 후 응답
 *   6. 모두 실패 시 윙글이 톤 에러
 */
import { SYSTEM_PROMPT_A, buildUserPromptA } from "../prompts/wingle.js";
import { callClaude, safeJsonParse } from "../lib/claude.js";
import { validateStrictA, validateSoftA } from "../lib/validators.js";
import { createSupabase } from "../lib/supabase.js";
import { jsonResponse } from "../lib/cors.js";
import { wingleErrorResponse, badRequestResponse } from "../lib/errors.js";

const ALLOWED_EMOTIONS = ["웃김", "멋짐", "공감", "충격", "호기심"];
const ALLOWED_PARTICIPATION = ["챌린지", "도전형", "관전형"];
const MIN_IDEA_LEN = 2;
const MAX_IDEA_LEN = 200;

export async function handleGenerateVariants(request, env) {
  // ─── 1. 입력 파싱 ──────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return badRequestResponse("JSON 형식이 아닌 요청", request);
  }

  const {
    user_id,
    core_idea,
    emotion_tone,
    participation,
    differentiator = "",
    reference = "",
  } = body;

  // 입력 검증 — 캐릭터 톤
  if (!user_id) return badRequestResponse("로그인 정보가 빠졌어", request);
  if (!core_idea || typeof core_idea !== "string") {
    return badRequestResponse("아이디어를 적어줘", request);
  }
  if (core_idea.length < MIN_IDEA_LEN) {
    return badRequestResponse("아이디어가 너무 짧아", request);
  }
  if (core_idea.length > MAX_IDEA_LEN) {
    return badRequestResponse(`아이디어는 ${MAX_IDEA_LEN}자 이내로 적어줘`, request);
  }
  if (!ALLOWED_EMOTIONS.includes(emotion_tone)) {
    return badRequestResponse(`감정 톤이 이상해 (${ALLOWED_EMOTIONS.join("/")} 중 하나)`, request);
  }
  if (!ALLOWED_PARTICIPATION.includes(participation)) {
    return badRequestResponse(`참여 구조가 이상해 (${ALLOWED_PARTICIPATION.join("/")} 중 하나)`, request);
  }

  // ─── 2. Claude 호출 + 재시도 루프 ──────────────────────
  const inputForPrompt = { core_idea, emotion_tone, participation, differentiator, reference };
  let parsed = null;
  let strict = { passed: false, errors: ["initial"] };
  let totalLatencyMs = 0;
  let totalUsage = { input_tokens: 0, output_tokens: 0 };
  let attempts = 0;

  for (attempts = 1; attempts <= 2; attempts++) {
    const userPrompt = buildUserPromptA(inputForPrompt, attempts > 1);

    let result;
    try {
      result = await callClaude({
        apiKey: env.ANTHROPIC_API_KEY,
        system: SYSTEM_PROMPT_A,
        user: userPrompt,
        temperature: 0.9,
        maxTokens: 1500,
      });
    } catch (e) {
      console.error(`[generate-variants] Claude call failed on attempt ${attempts}:`, e.message);
      if (attempts === 2) {
        return wingleErrorResponse("ai_call_failed", e.message, request, 502);
      }
      continue;
    }

    totalLatencyMs += result.latencyMs;
    totalUsage.input_tokens += result.usage?.input_tokens || 0;
    totalUsage.output_tokens += result.usage?.output_tokens || 0;

    parsed = safeJsonParse(result.text);
    if (!parsed) {
      console.warn(`[generate-variants] JSON parse failed on attempt ${attempts}`);
      strict = { passed: false, errors: ["JSON parse failed"] };
      continue;
    }

    strict = validateStrictA(parsed);
    if (strict.passed) break;

    console.warn(`[generate-variants] strict validation failed on attempt ${attempts}:`, strict.errors);
  }

  if (!strict.passed) {
    return wingleErrorResponse(
      "wingle_failed_strict",
      `Validation failed after ${attempts - 1} attempts: ${strict.errors.join(", ")}`,
      request,
      500
    );
  }

  // ─── 3. soft 검증 (로그만, 응답에는 포함시키되 비차단) ─
  const soft = validateSoftA(parsed, participation);
  if (soft.warnings.length > 0) {
    console.log(`[generate-variants] soft warnings:`, soft.warnings);
  }

  // ─── 4. Supabase 저장 ──────────────────────────────────
  let savedIdea;
  try {
    const supabase = createSupabase(env);
    savedIdea = await supabase.insert("ideas", {
      user_id,
      core_idea,
      emotion_tone,
      participation,
      differentiator,
      reference: reference || null,
      detected_flavor: parsed.detected_flavor,
      inferred_differentiator: parsed.inferred_differentiator,
      variants: parsed.variants,            // jsonb 컬럼
      is_shared: false,
      hot_score: 0,
    });
  } catch (e) {
    console.error(`[generate-variants] DB save failed:`, e.message);
    // DB 저장 실패해도 AI 결과는 반환 — 유저 경험 우선
    return jsonResponse(
      {
        ...parsed,
        _meta: {
          saved: false,
          attempts,
          latencyMs: totalLatencyMs,
          usage: totalUsage,
          softWarnings: soft.warnings,
        },
      },
      request,
      200
    );
  }

  // ─── 5. 성공 응답 ──────────────────────────────────────
  return jsonResponse(
    {
      idea_id: savedIdea.id,
      ...parsed,
      _meta: {
        saved: true,
        attempts,
        latencyMs: totalLatencyMs,
        usage: totalUsage,
        softWarnings: soft.warnings,
      },
    },
    request,
    200
  );
}
