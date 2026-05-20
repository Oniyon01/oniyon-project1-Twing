export function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGIN ?? '*';
  const allowedOrigin = allowed === '*' ? '*' : (origin === allowed ? origin : '');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status: status ?? 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
  });
}
