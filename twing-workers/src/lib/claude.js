/**
 * Claude API 호출 래퍼
 *
 * Cloudflare Workers는 Node.js 환경이 아니라서 anthropic SDK를 직접 못 써.
 * 대신 표준 fetch()로 https://api.anthropic.com/v1/messages 를 직접 호출.
 *
 * @param {Object} options
 * @param {string} options.apiKey       - Anthropic API key (env에서 주입)
 * @param {string} options.system       - 시스템 프롬프트
 * @param {string} options.user         - 유저 프롬프트
 * @param {number} options.temperature  - 창의성 (0~1)
 * @param {number} options.maxTokens    - 최대 출력 토큰
 * @param {string} options.model        - 모델명 (기본 claude-sonnet-4-5)
 * @returns {Promise<{ text: string, usage: object, latencyMs: number }>}
 */
export async function callClaude({
  apiKey,
  system,
  user,
  temperature = 0.9,
  maxTokens = 1500,
  model = "claude-sonnet-4-5",
}) {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY가 환경에 없어. wrangler secret으로 등록해.");
  }

  const start = Date.now();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  const latencyMs = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    throw new ClaudeApiError(
      `Claude API ${response.status}: ${errorText}`,
      response.status
    );
  }

  const data = await response.json();

  // 응답에서 텍스트만 추출 — content는 블록 배열이고, 우리는 type=text인 것만 필요
  const text = data.content
    ?.filter((block) => block.type === "text")
    ?.map((block) => block.text)
    ?.join("\n") || "";

  return {
    text,
    usage: data.usage,  // { input_tokens, output_tokens }
    latencyMs,
  };
}

/**
 * Claude API 전용 에러 클래스
 * 상위에서 instanceof로 잡아서 status에 따라 다른 처리 가능.
 */
export class ClaudeApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ClaudeApiError";
    this.status = status;
  }
}

/**
 * AI가 가끔 ```json ... ``` 코드 펜스로 감싸서 응답해.
 * JSON.parse 전에 펜스 제거.
 */
export function stripCodeFence(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

/**
 * 안전한 JSON 파싱 — 실패하면 null 반환 (throw 안 함)
 */
export function safeJsonParse(text) {
  try {
    return JSON.parse(stripCodeFence(text));
  } catch (e) {
    return null;
  }
}
