import { callClaude, extractJSON } from '../lib/claude.js';
import { createClient } from '../lib/supabase.js';
import { jsonResponse } from '../lib/cors.js';
import { wingleError } from '../lib/errors.js';
import { SYSTEM_PROMPT_A, buildUserPromptA } from '../prompts/wingle.js';
import { validateStrictA, validateSoftA } from '../validators.js';

export async function handleGenerateVariants(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return wingleError(400, '요청 형식이 잘못됐어요', request, env);
  }

  const { user_id, core_idea, emotion_tone, participation, differentiator, reference } = body;
  if (!user_id || !core_idea || !emotion_tone || !participation) {
    return wingleError(400, '필수 항목이 빠졌어요', request, env);
  }

  const userPrompt = buildUserPromptA({ core_idea, emotion_tone, participation, differentiator, reference });

  let parsed;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw;
    try {
      raw = await callClaude(env.ANTHROPIC_API_KEY, {
        system: SYSTEM_PROMPT_A,
        user: userPrompt,
        maxTokens: 4000,
      });
    } catch (e) {
      return wingleError(502, `Claude 호출 실패: ${e.message}`, request, env);
    }

    try {
      parsed = JSON.parse(extractJSON(raw));
    } catch {
      if (attempt === 2) return wingleError(502, null, request, env);
      continue;
    }

    if (validateStrictA(parsed)) break;
    if (attempt === 2 || !validateSoftA(parsed)) return wingleError(502, null, request, env);
  }

  const idea_id = crypto.randomUUID();
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    await db.ensureUser(user_id);
  } catch (e) {
    return wingleError(500, `유저 확인 실패: ${e.message}`, request, env);
  }

  try {
    await db.insert('ideas', {
      id: idea_id,
      user_id,
      core_idea,
      emotion_tone,
      participation,
      differentiator,
      reference: reference ?? null,
      category: parsed.category,
      detected_flavor: parsed.detected_flavor,
      inferred_differentiator: parsed.inferred_differentiator,
      variants: parsed.variants,
    });
  } catch (e) {
    return wingleError(500, `저장 실패: ${e.message}`, request, env);
  }

  return jsonResponse(
    {
      idea_id,
      detected_flavor: parsed.detected_flavor,
      inferred_differentiator: parsed.inferred_differentiator,
      variants: parsed.variants,
    },
    200,
    request,
    env,
  );
}
