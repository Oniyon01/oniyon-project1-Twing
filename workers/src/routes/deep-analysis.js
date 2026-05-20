import { callClaude, extractJSON } from '../lib/claude.js';
import { createClient } from '../lib/supabase.js';
import { jsonResponse } from '../lib/cors.js';
import { wingleError } from '../lib/errors.js';
import { SYSTEM_PROMPT_B, buildUserPromptB } from '../prompts/wingle.js';
import { validateStrictB } from '../validators.js';

export async function handleDeepAnalysis(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return wingleError(400, '요청 형식이 잘못됐어요', request, env);
  }

  const { idea_id, selected_variant_index } = body;
  if (!idea_id || typeof selected_variant_index !== 'number') {
    return wingleError(400, '필수 항목이 빠졌어요', request, env);
  }

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  let idea;
  try {
    idea = await db.getById('ideas', idea_id);
  } catch (e) {
    return wingleError(500, `DB 조회 실패: ${e.message}`, request, env);
  }
  if (!idea) return wingleError(404, '아이디어를 찾을 수 없어요', request, env);

  // 동일한 variant 인덱스에 대한 캐시가 있으면 재호출 없이 반환
  if (idea.deep_analysis && idea.selected_variant_index === selected_variant_index) {
    return jsonResponse({ idea_id, ...idea.deep_analysis }, 200, request, env);
  }

  const variant = idea.variants?.[selected_variant_index];
  if (!variant) return wingleError(400, '잘못된 variant 인덱스예요', request, env);

  const userPrompt = buildUserPromptB({
    core_idea: idea.core_idea,
    emotion_tone: idea.emotion_tone,
    participation: idea.participation,
    variant,
  });

  let parsed;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw;
    try {
      raw = await callClaude(env.ANTHROPIC_API_KEY, {
        system: SYSTEM_PROMPT_B,
        user: userPrompt,
        maxTokens: 5000,
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

    if (validateStrictB(parsed)) break;
    if (attempt === 2) return wingleError(502, null, request, env);
  }

  if (!validateStrictB(parsed)) return wingleError(502, null, request, env);

  try {
    await db.update('ideas', idea_id, {
      deep_analysis: parsed,
      selected_variant_index,
      is_shared: true,
      shared_at: new Date().toISOString(),
    });
  } catch {
    // 저장 실패해도 결과는 반환
  }

  return jsonResponse({ idea_id, ...parsed }, 200, request, env);
}
