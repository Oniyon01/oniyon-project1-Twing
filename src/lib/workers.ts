import type { IdeaInput, VariantsResult, DeepAnalysis } from '../types';

// DEV: Vite proxy가 /api/* → localhost:8787 으로 포워딩 (Codespace 환경 대응)
// PROD: VITE_WORKERS_URL 환경변수에 Workers 배포 URL 설정
const BASE_URL = import.meta.env.VITE_WORKERS_URL ?? '';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message ?? `API error ${res.status}`);
  return json as T;
}

export function generateVariants(userId: string, input: IdeaInput): Promise<VariantsResult> {
  return post<VariantsResult>('/api/generate-variants', {
    user_id: userId,
    core_idea: input.core_idea,
    emotion_tone: input.emotion_tone,
    participation: input.participation,
    differentiator: input.differentiator,
    reference: input.reference ?? '',
  });
}

export function deepAnalysis(ideaId: string, selectedVariantIndex: number): Promise<DeepAnalysis> {
  return post<DeepAnalysis>('/api/deep-analysis', {
    idea_id: ideaId,
    selected_variant_index: selectedVariantIndex,
  });
}
