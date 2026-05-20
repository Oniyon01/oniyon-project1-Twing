import { handleGenerateVariants } from './routes/generate-variants.js';
import { handleDeepAnalysis } from './routes/deep-analysis.js';
import { corsHeaders, jsonResponse } from './lib/cors.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === 'GET' && pathname === '/') {
      return jsonResponse({ status: 'ok', version: '1.1' }, 200, request, env);
    }

    if (request.method === 'POST' && pathname === '/api/generate-variants') {
      return handleGenerateVariants(request, env);
    }

    if (request.method === 'POST' && pathname === '/api/deep-analysis') {
      return handleDeepAnalysis(request, env);
    }

    return jsonResponse({ message: '찾을 수 없어요' }, 404, request, env);
  },
};
