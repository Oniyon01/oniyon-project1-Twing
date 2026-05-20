const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export async function callClaude(apiKey, { system, user, maxTokens = 2048, thinking }) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  };

  if (thinking) body.thinking = thinking;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Claude API error ${res.status}`);
  }

  const data = await res.json();

  // thinking 활성 시 content 배열에 thinking 블록이 먼저 오므로 text 블록만 추출
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Claude 응답에 text 블록이 없습니다');
  return textBlock.text;
}

// Claude가 ```json ... ``` 블록으로 감쌀 경우 추출
export function extractJSON(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}
