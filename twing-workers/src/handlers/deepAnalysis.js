/**
 * POST /api/deep-analysis
 *
 * 유저가 결과 화면에서 variant 1개를 골라 "피드 공유"를 누르면 호출됨.
 * 프롬프트 B를 호출해서 심층 분석 + 확산 플레이북 생성.
 * ideas.is_shared = true로 업데이트.
 *
 * 요청 body: { idea_id, selected_variant_index }
 */
import { SYSTEM_PROMPT_B, buildUserPromptB } from "../prompts/wingle.js";
import { callClaude, safeJsonParse } from "../lib/claude.js";
import { validateStrictB } from "../lib/validators.js";
import { createSupabase } from "../lib/supabase.js";
import { jsonResponse } from "../lib/cors.js";
import { wingleErrorResponse, badRequestResponse } from "../lib/errors.js";

export async function handleDeepAnalysis(request, env) {
  // ─── 1. 입력 파싱 ──────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return badRequestResponse("JSON 형식이 아닌 요청", request);
  }

  const { idea_id, selected_variant_index } = body;

  if (!idea_id) return badRequestResponse("idea_id가 빠졌어", request);
  if (!Number.isInteger(selected_variant_index) ||
      selected_variant_index < 0 ||
      selected_variant_index > 2) {
    return badRequestResponse("variant 선택이 이상해 (0/1/2 중 하나)", request);
  }

  // ─── 2. DB에서 원본 아이디어 조회 ──────────────────────
  const supabase = createSupabase(env);
  let idea;
  try {
    idea = await supabase.getById("ideas", idea_id);
  } catch (e) {
    console.error(`[deep-analysis] DB read failed:`, e.message);
    return wingleErrorResponse("db_read_failed", e.message, request, 500);
  }

  if (!idea) {
    return badRequestResponse("그 아이디어를 못 찾겠어", request);
  }

  const variants = idea.variants;
  if (!Array.isArray(variants) || !variants[selected_variant_index]) {
    return badRequestResponse("선택한 variant가 없어", request);
  }

  const selectedVariant = variants[selected_variant_index];

  // 이미 분석한 variant라면 그대로 반환 (중복 호출 방지 + 비용 절감)
  if (idea.is_shared && idea.deep_analysis &&
      idea.selected_variant_index === selected_variant_index) {
    return jsonResponse(
      { idea_id, ...idea.deep_analysis, _meta: { cached: true } },
      request,
      200
    );
  }

  // ─── 3. Claude 호출 + 재시도 루프 ──────────────────────
  const inputForPrompt = {
    core_idea: idea.core_idea,
    emotion_tone: idea.emotion_tone,
    participation: idea.participation,
    selected_variant: selectedVariant,
  };

  let parsed = null;
  let strict = { passed: false, errors: ["initial"] };
  let totalLatencyMs = 0;
  let totalUsage = { input_tokens: 0, output_tokens: 0 };
  let attempts = 0;

  for (attempts = 1; attempts <= 2; attempts++) {
    const userPrompt = buildUserPromptB(inputForPrompt, attempts > 1);

    let result;
    try {
      result = await callClaude({
        apiKey: env.ANTHROPIC_API_KEY,
        system: SYSTEM_PROMPT_B,
        user: userPrompt,
        temperature: 0.6,    // B는 정확성 우선
        maxTokens: 2500,
      });
    } catch (e) {
      console.error(`[deep-analysis] Claude call failed on attempt ${attempts}:`, e.message);
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
      console.warn(`[deep-analysis] JSON parse failed on attempt ${attempts}`);
      strict = { passed: false, errors: ["JSON parse failed"] };
      continue;
    }

    strict = validateStrictB(parsed);
    if (strict.passed) break;

    console.warn(`[deep-analysis] strict validation failed on attempt ${attempts}:`, strict.errors);
  }

  if (!strict.passed) {
    return wingleErrorResponse(
      "wingle_failed_strict",
      `Validation failed after ${attempts - 1} attempts: ${strict.errors.join(", ")}`,
      request,
      500
    );
  }

  // ─── 4. DB 업데이트 — is_shared=true + deep_analysis 저장 ─
  try {
    await supabase.update("ideas", idea_id, {
      is_shared: true,
      selected_variant_index,
      deep_analysis: parsed,
      shared_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error(`[deep-analysis] DB update failed:`, e.message);
    // 저장 실패해도 결과는 반환
    return jsonResponse(
      {
        idea_id,
        ...parsed,
        _meta: {
          saved: false,
          attempts,
          latencyMs: totalLatencyMs,
          usage: totalUsage,
        },
      },
      request,
      200
    );
  }

  // ─── 5. 성공 응답 ──────────────────────────────────────
  return jsonResponse(
    {
      idea_id,
      ...parsed,
      _meta: {
        saved: true,
        attempts,
        latencyMs: totalLatencyMs,
        usage: totalUsage,
      },
    },
    request,
    200
  );
}
