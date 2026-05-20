# CLAUDE.md


## 작업방식
- 하나의 파일에 코드를 다 넣지 말고, 기능별로 모듈화.
- 요청이 명확하지 않을 때, 추론 및 실행을 하지말고 우선 내 설명을 제대로 이해했는지 말해.
- 많은 부분을 수정해야 한다면 나에게 물어볼 것.

## 제품 문서
- PRD: `Twing_2.0_PRD.md` 참고 (제품 개요, 핵심 기능, 기술 스택, 개발 로드맵 포함)
- 마스코트: 윙글이(wingle), 캐릭터에 대한 내용이 필요하다면 'wingle_character_bible.md'를 참고
- Twing 2.0 컨셉: "유저가 트렌드 아이디어를 제안하면, 윙글이가 다듬어서 세상에 내보낸다"

## 배포
- 배포 = git push (Cloudflare Pages 자동 배포)

## 기술 스택
- Frontend: React (Vite) + TypeScript
- Backend: Cloudflare Workers
- DB + Auth: Supabase (PostgreSQL + Realtime)
- Storage: Cloudflare R2

## 지침

- 1. Think Before Coding
    Don't assume. Don't hide confusion. Surface tradeoffs.

    Before implementing:

    State your assumptions explicitly. If uncertain, ask.
    If multiple interpretations exist, present them - don't pick silently.
    If a simpler approach exists, say so. Push back when warranted.
    If something is unclear, stop. Name what's confusing. Ask.

- 2. Simplicity First
    Minimum code that solves the problem. Nothing speculative.

    No features beyond what was asked.
    No abstractions for single-use code.
    No "flexibility" or "configurability" that wasn't requested.
    No error handling for impossible scenarios.
    If you write 200 lines and it could be 50, rewrite it.
    Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

- 3. Surgical Changes
    Touch only what you must. Clean up only your own mess.

    When editing existing code:

        Don't "improve" adjacent code, comments, or formatting.
        Don't refactor things that aren't broken.
        Match existing style, even if you'd do it differently.
        If you notice unrelated dead code, mention it - don't delete it.

    When your changes create orphans:

        Remove imports/variables/functions that YOUR changes made unused.
        Don't remove pre-existing dead code unless asked.
        The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
    Define success criteria. Loop until verified.

    Transform tasks into verifiable goals:

        "Add validation" → "Write tests for invalid inputs, then make them pass"
        "Fix the bug" → "Write a test that reproduces it, then make it pass"
        "Refactor X" → "Ensure tests pass before and after"
        For multi-step tasks, state a brief plan:

    1. [Step] → verify: [check]
    2. [Step] → verify: [check]
    3. [Step] → verify: [check]

## 현재 구조
```
(프론트엔드)
src/
 ├─ App.tsx                     ← 세션(intro/feed/auth/mypage/idea-input/idea-variants/idea-unlock) + auth
 │                                  Realtime: ideas 테이블 INSERT/UPDATE 구독 (is_shared=true 행만 피드 반영)
 │                                  바텀 탭(홈/윙글픽/만들기/챌린지/마이) + 아이디어 창작 플로우 상태
 │                                  DevPanel 상태(devNewUserMode/devOnboarded/devErrorOverride/devUserOverride)
 ├─ styles.css                  ← 라이트 모드: 배경 #d9d4ef 계열 라벤더, 텍스트 #1a1530 계열 짙은 보라톤
 ├─ theme/
 │   └─ categories.ts           ← ★ 10개 카테고리 메타데이터 (key·emoji·color·colorLight·bg·border·description)
 │                                  워커의 src/constants/categories.js와 key 1:1 동일 (한글)
 │                                  Category 타입, CATEGORIES 배열, getCategoryMeta(key) / getCategoryColor(meta) 함수 export
 │                                  color=다크모드 텍스트색, colorLight=라이트모드 텍스트색 (각 컬러의 진한 버전)
 ├─ lib/
 │   ├─ supabase.ts
 │   ├─ trends.ts               ← ★ ideas 테이블 기반으로 전면 교체 (구 trends 테이블 미사용)
 │   │                              IdeaRow 타입 (선택된 variant 인덱스·투표 카운터·hot_score 포함)
 │   │                              rowToTrend(): IdeaRow → Trend 변환 (variants[selected_index]에서 title·hashtag·ai_comment 추출)
 │   │                              fetchTrends(): ideas where is_shared=true, hot_score DESC
 │   │                              castVote/changeVote/removeVote: feedbacks 테이블 INSERT/UPDATE/DELETE (try|watch만 저장, 'no'는 no-op)
 │   │                              likeTrend/unlikeTrend: likes 테이블
 │   │                              fetchComments/addComment/fetchCommentCount: comments 테이블 (idea_id 기반)
 │   │                              incrementViews: no-op (ideas 테이블에 views 컬럼 없음)
 │   ├─ ranking.ts              ← hotScore, totalScore, isThisWeek, GRADES, getGrade, gradeProgress, POINT_TABLE, streak helpers, badge helpers
 │   └─ workers.ts              ← generateVariants(POST /api/generate-variants), deepAnalysis(POST /api/deep-analysis)
 │                                  BASE_URL = '' → Vite proxy(/api/*→8787) 경유 (Codespace 환경 대응)
 │                                  프로덕션: VITE_WORKERS_URL 환경변수 설정
 ├─ data/
 │   ├─ mockIdea.ts             ← 데모 버튼용 목업 (MOCK_IDEA_INPUT / MOCK_VARIANTS / MOCK_DEEP_ANALYSIS)
 │   ├─ mockTrends.ts           ← 미사용 (dead code)
 │   └─ trends.ts               ← 미사용 (dead code)
 ├─ components/
 │   ├─ IntroScreen.tsx/css
 │   ├─ AuthScreen.tsx/css
 │   ├─ Feed.tsx                ← 아이디어 피드 (최신순/인기순) + forceNewUser + forceOnboarded prop으로 신규유저/온보딩 상태 강제 전환 지원
 │   ├─ EmptyFeed.tsx/css       ← 피드 빈 상태 3종: new-user(환영카드+시딩카드+사용법), no-results(검색 결과 없음), error(네트워크 오류)
 │                                  시딩 카드: getCategoryMeta() + getCategoryColor()로 카테고리 인라인 스타일 적용 (한글 키)
 │   ├─ TrendCard.tsx/css       ← 카드 본문 클릭→상세, 투표·추가제안
 │                                  카테고리 뱃지: getCategoryMeta() + getCategoryColor()로 인라인 스타일 적용 (다크/라이트 자동 전환)
 │                                  ⋯ 버튼: 드롭다운 메뉴(🔗 공유하기 / 🚩 신고하기), 외부 클릭 시 닫힘
 │   ├─ TrendDetail.tsx/css     ← 아이디어 상세 전체화면 (참여의향·추천플랫폼·추가제안 섹션)
 │                                  카테고리 뱃지: getCategoryMeta() + getCategoryColor() 적용
 │                                  라이트 모드 label 색상: .detail-section-label { color: #5b35a8 } 오버라이드
 │   ├─ VoteButtons.tsx         ← 해볼래(yes→try) / 구경할래(maybe→watch) / 글쎄(no→DB 저장 안 함)
 │   ├─ WinglePick.tsx/css      ← 윙글이픽 탭 (실시간TOP10·주간TOP10·명예전당), 카드 클릭→상세
 │   ├─ ChallengeBoard.tsx/css  ← 챌린지 탭 (SNS핫챌린지·Twing발 갓생 카테고리 필터)
 │   ├─ IdeaInputScreen.tsx/css ← 아이디어 창작 입력 (Step0: core_idea / Step1: 감정톤·참여구조·차별점 3질문 + 데모버튼)
 │   ├─ VariantsScreen.tsx/css  ← variant 3개 카드 선택 → "피드 공유 + 잠금 해제" CTA
 │   ├─ UnlockScreen.tsx/css    ← 심층 분석 결과 (총평·플랫폼전략·scale_playbook 4단계 타임라인·리스크·이기는법)
 │   ├─ CategoryRanking.tsx/css ← 카테고리별 순위 탭 (CATEGORIES from theme/categories)
 │   ├─ GradeCard.tsx/css       ← 트렌드세터 등급·포인트·스트릭·뱃지 (마이페이지 내 표시)
 │   ├─ CommentAuthor.tsx/css   ← 댓글 작성자 행 (아바타·닉네임·등급칩·뱃지칩·호버 툴팁)
 │   ├─ RankingPanel.tsx/css    ← 피드 사이드 순위 패널 (CATEGORIES from theme/categories)
 │   ├─ DevPanel.tsx/css        ← 개발자 테스트 패널 (우하단 고정, 신규유저모드·네트워크오류·투표생성기·초기화 등)
 │   └─ MyPage.tsx/css          ← 프로필 편집 + 트렌드세터 등급 섹션
 └─ types/
     ├─ index.ts                ← Trend·Comment·VoteType + IdeaInput·Variant·VariantsResult·ScalePlaybook·DeepAnalysis
     │                             Category·CategoryMeta는 theme/categories.ts에서 re-export
     └─ database.ts

## 카테고리 키 (한글, 10개)
갓생 | 힐링 | 컬처 | 일상 | 푸드 | 스타일 | 테크 | 펫 | 게임 | 유머
- 클라이언트(theme/categories.ts)와 워커(src/constants/categories.js)가 동일한 키 사용
- "기타" 카테고리 없음 (AI 게으른 분류 방지)

## 아이디어 창작 → 피드 등록 흐름
1. IdeaInputScreen → POST /api/generate-variants → ideas 저장 (is_shared=false)
2. VariantsScreen → variant 선택 → POST /api/deep-analysis
3. deep-analysis 완료 시 Workers가 ideas 업데이트: is_shared=true, shared_at=now()
4. App.tsx Realtime 구독이 INSERT 이벤트 감지 → 피드에 자동 추가

(백엔드 — Cloudflare Workers)
workers/                        ← 로컬: wrangler dev (localhost:8787), 프로덕션: wrangler deploy
 ├─ wrangler.toml               ← Workers 설정 (SUPABASE_URL, ALLOWED_ORIGIN 여기서 수정)
 ├─ package.json                ← scripts: dev / deploy / secret:bulk
 ├─ .dev.vars                   ← 로컬 시크릿 (gitignore) ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN=*
 ├─ .dev.vars.example           ← 템플릿
 ├─ secrets.example.json        ← 프로덕션 시크릿 템플릿 (npm run secret:bulk로 일괄 등록)
 └─ src/
     ├─ index.js                ← 메인 라우터 (GET / 헬스체크, POST 2개 라우팅)
     ├─ prompts/
     │   └─ wingle.js           ← SYSTEM_PROMPT_A: 윙글이 페르소나 + 2026 트렌드 감각 + 카테고리 가이드 + JSON 스키마
     │                              SYSTEM_PROMPT_B: 플랫폼 알고리즘 감각 + participation별 플레이북 분기 + 점수 인플레 금지
     │                              buildUserPromptA(input): {placeholder} 치환 방식
     │                              buildUserPromptB({core_idea, emotion_tone, participation, variant}): variant를 JSON 직렬화해서 주입
     ├─ routes/
     │   ├─ generate-variants.js ← POST /api/generate-variants
     │   │                           ensureUser() → Claude A 호출(thinking:adaptive, effort:high, maxTokens:20000)
     │   │                           validateStrictA 실패 시 1회 재시도 → ideas INSERT (is_shared=false)
     │   └─ deep-analysis.js    ← POST /api/deep-analysis
     │                              캐시 체크(deep_analysis 이미 있으면 재호출 없이 반환)
     │                              Claude B 호출(thinking:adaptive, effort:high, maxTokens:20000)
     │                              validateStrictB → ideas UPDATE: deep_analysis + is_shared=true + shared_at
     ├─ validators.js            ← validateStrictA/B, validateSoftA
     │                              validateStrictA: category가 CATEGORY_KEY_SET 한글 키인지, variants 3개 형식 검증
     │                              validateStrictB: platform_plans 3개·scale_playbook·verdict 구조 검증
     └─ lib/
         ├─ claude.js            ← fetch 기반 Claude API 래퍼 (SDK 미사용)
         │                           thinking·outputConfig 옵션 지원, content 배열에서 text 블록 추출 (thinking 블록 건너뜀)
         ├─ supabase.js          ← PostgREST 직접 호출 (insert/getById/update/ensureUser), service_role로 RLS 우회
         │                           ensureUser(id): users 행 없으면 생성 (ignore-duplicates), FK 오류 방지
         ├─ cors.js              ← CORS 헤더, jsonResponse 헬퍼
         ├─ errors.js            ← 윙글이 톤 랜덤 에러 응답
         └─ constants/
             ├─ categories.js   ← ★ 10개 카테고리 단일 진실 소스 (클라이언트 categories.ts와 key 1:1)
             └─ messages.js     ← 윙글이 실패 메시지 풀

(로컬 개발)
- Workers: cd workers && npm run dev  →  localhost:8787
- Frontend: npm run dev  →  localhost:5173
- vite.config.ts의 proxy: /api/* → localhost:8787 (Codespace에서 브라우저가 localhost:8787에 직접 접근 불가한 문제 해결)
- CORS: .dev.vars의 ALLOWED_ORIGIN=* (로컬 전용, 프로덕션은 wrangler.toml의 ALLOWED_ORIGIN 사용)

(DB 스키마)
supabase/migrations/
 ├─ 20260426000001_twing_2_0.sql   ← 메인 스키마: users·ideas·feedbacks·comments·likes 5개 테이블
 │                                     인덱스 9개, 트리거 6개 (hot_score·등급·포인트·첫아이디어보너스·updated_at)
 │                                     calc_hot_score(), add_points(), points_to_grade() 함수
 │                                     RLS 정책 + Realtime 활성화
 └─ 20260516000001_add_category_to_ideas.sql  ← ideas 테이블에 category 컬럼 추가 (10개 한글 키 CHECK)

(DB 핵심 설계)
- ideas.is_shared=true → 피드에 노출 (deep-analysis 완료 시 Workers가 자동 설정)
- ideas.variants: jsonb 배열 (Claude 프롬프트 A 출력 3개)
- ideas.deep_analysis: jsonb (Claude 프롬프트 B 출력, 캐시용)
- feedbacks.vote_type: 'try'|'watch' (VoteType 'yes'→try, 'maybe'→watch, 'no'→저장 안 함)
- hot_score 트리거: likes/feedbacks/comments INSERT·DELETE 시 자동 갱신
- 구 trends 테이블: 데이터 전체 삭제, 미사용 (레거시)
```
---


