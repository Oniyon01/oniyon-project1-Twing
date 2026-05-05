# 🦊 Twing Workers

Twing 2.0의 Cloudflare Workers 백엔드 — 윙글이 AI 프롬프트 호출 + Supabase 연동.

## 📦 무엇이 들어있나

| 경로 | 역할 |
|---|---|
| `src/index.js` | 메인 진입점 (라우터) |
| `src/handlers/generateVariants.js` | `POST /api/generate-variants` — 프롬프트 A |
| `src/handlers/deepAnalysis.js` | `POST /api/deep-analysis` — 프롬프트 B |
| `src/prompts/wingle.js` | 윙글이 페르소나 + 프롬프트 빌더 |
| `src/lib/claude.js` | Claude API fetch 래퍼 |
| `src/lib/supabase.js` | Supabase REST API 래퍼 |
| `src/lib/validators.js` | strict/soft 검증 |
| `src/lib/cors.js` | CORS 헬퍼 |
| `src/lib/errors.js` | 윙글이 톤 에러 응답 |
| `src/constants/messages.js` | 윙글이 실패 메시지 풀 |

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 시크릿 등록

```bash
# Anthropic API 키 (https://console.anthropic.com 에서 발급)
npm run secret:claude

# Supabase Service Role Key (Supabase 대시보드 > Settings > API)
npm run secret:supabase
```

`wrangler secret put`은 시크릿을 Cloudflare에 안전하게 올리는 방식이야. 코드에 절대 평문으로 넣지 말 것.

### 3. `wrangler.toml` 수정

`SUPABASE_URL` 값을 본인 프로젝트 URL로 바꿔.

### 4. 로컬 개발

```bash
# .dev.vars 파일을 만들고 시크릿 값 채워넣기
cp .dev.vars.example .dev.vars
# (편집기로 .dev.vars를 열어서 실제 값 입력)

npm run dev   # http://localhost:8787 에 서버 뜸
```

### 5. 배포

```bash
npm run deploy
```

배포 후엔 `https://twing-workers.<your-subdomain>.workers.dev` 에서 호출 가능.

## 📡 API 사용법

### `POST /api/generate-variants`

**요청:**
```json
{
  "user_id": "uuid-of-user",
  "core_idea": "할머니 패션",
  "emotion_tone": "멋짐",
  "participation": "챌린지",
  "differentiator": "할머니를 공동 주연으로 세움",
  "reference": ""
}
```

**응답 (성공):**
```json
{
  "idea_id": "uuid-of-idea",
  "detected_flavor": "Y2K 리바이벌 × 그랜마코어 × 세대 간 스타일링",
  "inferred_differentiator": "할머니를 공동 주연으로 세움",
  "variants": [...3개...],
  "_meta": {
    "saved": true,
    "attempts": 1,
    "latencyMs": 4321,
    "usage": { "input_tokens": 850, "output_tokens": 720 },
    "softWarnings": []
  }
}
```

**응답 (실패):**
```json
{
  "error": "wingle_failed_strict",
  "message": "음... 윙글이가 헛소리했네 한 번만 다시 해볼래? 🤔",
  "debug": "Validation failed after 2 attempts: ..."
}
```

### `POST /api/deep-analysis`

**요청:**
```json
{
  "idea_id": "uuid-of-idea",
  "selected_variant_index": 0
}
```

**응답:** 프롬프트 B 출력 JSON 그대로 + `_meta`

## 🛡️ 보안 노트

- `SUPABASE_SERVICE_KEY`는 RLS를 우회하므로 **Worker 내부에서만 사용**. 프론트엔드에 절대 노출 금지.
- 운영 환경에서는 `user_id`가 진짜 인증된 유저인지 검증하는 미들웨어 추가 권장 (Supabase JWT 검증).
- Rate limiting이 필요하면 [Cloudflare Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) 추가.
- CORS 허용 도메인은 `src/lib/cors.js` 의 `ALLOWED_ORIGINS` 에서 관리.

## 🧪 테스트

로컬에서 `wrangler dev` 실행 후:

```bash
curl -X POST http://localhost:8787/api/generate-variants \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-001",
    "core_idea": "할머니 패션",
    "emotion_tone": "멋짐",
    "participation": "챌린지",
    "differentiator": "할머니를 공동 주연으로 세움"
  }'
```

## 📝 운영 팁

- **로그 추적:** `wrangler tail` 실행 후 실시간 로그 확인. soft warnings도 여기서 보임.
- **응답 시간:** 프롬프트 A 평균 3-5초, B는 5-8초. 5초 넘게 걸리면 max_tokens 줄이거나 모델을 더 빠른 걸로.
- **비용 모니터링:** `_meta.usage`로 토큰 사용량 트래킹. Supabase에 별도 `api_calls` 테이블 만들어 누적 추적 권장.
- **프롬프트 수정:** `src/prompts/wingle.js`만 수정하면 배포만으로 반영. 프롬프트 버저닝하고 싶으면 객체로 둬서 A/B 테스트 가능.

## 🔗 관련 문서

- 프롬프트 최종본: `twing_prompts_final.md`
- PRD: `Twing_2_0_PRD.md`
- 윙글이 캐릭터 바이블: `wingle_character_bible.md`
