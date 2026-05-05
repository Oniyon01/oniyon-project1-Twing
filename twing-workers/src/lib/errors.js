/**
 * 에러 응답 헬퍼
 *
 * 시스템 에러도 윙글이 캐릭터로 풀어내야 일관성 유지.
 * 영어 에러 코드는 클라이언트가 분기 처리용으로 쓰고,
 * message는 유저에게 그대로 보여줄 수 있는 윙글이 톤.
 */
import { jsonResponse } from "./cors.js";
import { WINGLE_FAILURE_MESSAGES } from "../constants/messages.js";

/**
 * 윙글이 톤의 무작위 실패 메시지
 */
export function pickWingleFailureMessage() {
  const arr = WINGLE_FAILURE_MESSAGES;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 윙글이 캐릭터 톤의 에러 응답 생성
 * @param {string} code         - 클라이언트 분기용 에러 코드 (e.g., "wingle_failed")
 * @param {string} debugMessage - 디버그용 (운영 모드면 가림)
 * @param {Request} request     - CORS 헤더용
 * @param {number} status       - HTTP status
 */
export function wingleErrorResponse(code, debugMessage, request, status = 500) {
  return jsonResponse(
    {
      error: code,
      message: pickWingleFailureMessage(),
      debug: debugMessage,  // 운영 시 빼는 것도 고려
    },
    request,
    status
  );
}

/**
 * 입력 검증 실패용 (400) — 캐릭터 톤이지만 좀 더 정보적
 */
export function badRequestResponse(reason, request) {
  return jsonResponse(
    {
      error: "bad_input",
      message: `음 입력이 좀 부족한데? ${reason}`,
    },
    request,
    400
  );
}
