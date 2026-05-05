/**
 * Twing 2.0 Cloudflare Workers — 메인 진입점
 *
 * Cloudflare Workers는 export default { fetch }가 진입점.
 * 요청이 들어오면 fetch 함수가 호출되고, URL을 보고 핸들러로 라우팅.
 *
 * 라우트:
 *   OPTIONS *                          → CORS preflight
 *   POST /api/generate-variants        → 프롬프트 A
 *   POST /api/deep-analysis            → 프롬프트 B
 *   GET  /                             → 헬스체크
 *   *                                  → 404
 */
import { handleGenerateVariants } from "./handlers/generateVariants.js";
import { handleDeepAnalysis } from "./handlers/deepAnalysis.js";
import { handlePreflight, jsonResponse } from "./lib/cors.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // ─── CORS preflight ──────────────────────────────────
    if (method === "OPTIONS") {
      return handlePreflight(request);
    }

    // ─── 헬스체크 ─────────────────────────────────────────
    if (method === "GET" && pathname === "/") {
      return jsonResponse(
        {
          service: "twing-workers",
          status: "ok",
          time: new Date().toISOString(),
        },
        request
      );
    }

    // ─── 라우팅 ──────────────────────────────────────────
    try {
      if (method === "POST" && pathname === "/api/generate-variants") {
        return await handleGenerateVariants(request, env);
      }
      if (method === "POST" && pathname === "/api/deep-analysis") {
        return await handleDeepAnalysis(request, env);
      }
    } catch (e) {
      // 핸들러에서 흘러나온 예외는 여기서 잡아서 일관되게 처리
      console.error(`[fatal] ${pathname}:`, e.stack || e.message);
      return jsonResponse(
        {
          error: "internal_error",
          message: "윙글이가 잠깐 멍 때렸어 다시 해줄래? 💀",
        },
        request,
        500
      );
    }

    // ─── 404 ─────────────────────────────────────────────
    return jsonResponse(
      { error: "not_found", message: "그런 길은 없어 🤔" },
      request,
      404
    );
  },
};
