import { WINGLE_FAIL_MESSAGES } from '../constants/messages.js';
import { jsonResponse } from './cors.js';

function pickFailMessage() {
  return WINGLE_FAIL_MESSAGES[Math.floor(Math.random() * WINGLE_FAIL_MESSAGES.length)];
}

export function wingleError(status, message, request, env) {
  return jsonResponse({ message: message ?? pickFailMessage() }, status, request, env);
}
