/**
 * CORS 헬퍼
 *
 * Twing 앱이 다른 도메인(twing.app, localhost:5173 등)에서 호출하므로 CORS 처리 필수.
 * 운영 시 ALLOWED_ORIGINS를 env로 빼서 환경별로 다르게 설정 권장.
 */

const ALLOWED_ORIGINS = [
  "https://twing.app",       // 프로덕션 (예시)
  "http://localhost:5173",   // Vite 개발 서버
  "http://localhost:8081",   // Expo 개발 서버
];

/**
 * 요청 origin이 허용 리스트에 있으면 그 origin을, 없으면 첫 번째 허용 origin을 반환
 */
function pickOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[0];
}

/**
 * CORS 헤더 객체 생성
 */
export function corsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": pickOrigin(request),
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * preflight (OPTIONS) 요청 처리
 */
export function handlePreflight(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

/**
 * JSON 응답 헬퍼 — CORS 헤더 자동 부착
 */
export function jsonResponse(data, request, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
    },
  });
}
