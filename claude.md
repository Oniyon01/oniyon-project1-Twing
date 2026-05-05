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
 ├─ App.tsx                     ← 세션(intro/feed/auth/mypage/idea-input/idea-variants/idea-unlock) + auth + Realtime + 바텀 탭(홈/윙글픽/만들기/챌린지/마이) + 아이디어 창작 플로우 상태 + DevPanel 상태(devNewUserMode/devErrorOverride/devUserOverride)
 ├─ styles.css
 ├─ theme/
 │   └─ categories.ts           ← ★ 10개 카테고리 메타데이터 (key·emoji·color·bg·border·description)
 │                                  워커의 src/constants/categories.js와 key 1:1 동일 (한글)
 │                                  Category 타입, CATEGORIES 배열, getCategoryMeta(key) 함수 export
 ├─ lib/
 │   ├─ supabase.ts
 │   ├─ trends.ts               ← fetchTrends, castVote, changeVote, removeVote, fetchComments, fetchCommentCount, addComment, incrementViews, likeTrend, unlikeTrend
 │   ├─ ranking.ts              ← hotScore, totalScore, isThisWeek, GRADES, getGrade, gradeProgress, POINT_TABLE, streak helpers, badge helpers
 │   └─ workers.ts              ← generateVariants(POST /api/generate-variants), deepAnalysis(POST /api/deep-analysis); VITE_WORKERS_URL 환경변수
 ├─ data/
 │   ├─ mockIdea.ts             ← 데모용 목업 데이터 (MOCK_IDEA_INPUT / MOCK_VARIANTS / MOCK_DEEP_ANALYSIS)
 │   ├─ mockTrends.ts           ← 로컬 개발용 목업 트렌드 (카테고리 키: 한글)
 │   └─ trends.ts               ← 정적 트렌드 목업 9개 (카테고리 키: 한글)
 ├─ components/
 │   ├─ IntroScreen.tsx/css
 │   ├─ AuthScreen.tsx/css
 │   ├─ Feed.tsx                ← 아이디어 피드 (최신순/인기순) + 상단 "아이디어 등록하기" CTA 버튼 + forceNewUser prop으로 신규유저 화면 강제 전환 지원
 │   ├─ EmptyFeed.tsx/css       ← 피드 빈 상태 3종: new-user(환영카드+시딩카드+사용법), no-results(검색 결과 없음), error(네트워크 오류)
 │   ├─ TrendCard.tsx           ← 카드 본문 클릭→상세, 투표·추가제안
 │                                  좋아요 버튼 없음
 │                                  카테고리 뱃지: getCategoryMeta()로 인라인 스타일 적용
 │                                  ⋯ 버튼: 드롭다운 메뉴(🔗 공유하기 / 🚩 신고하기), 외부 클릭 시 닫힘
 │   ├─ TrendDetail.tsx/css     ← 아이디어 상세 전체화면 (참여의향·추천플랫폼·추가제안 섹션)
 │   ├─ VoteButtons.tsx         ← 해볼래 / 구경할래 / 글쎄  (보는중 → 구경할래 변경됨)
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

(백엔드 — Cloudflare Workers)
twing-workers/                  ← 현재 v1.0 (repo 반영 버전)
 ├─ wrangler.toml               ← Workers 설정 (SUPABASE_URL 여기서 수정)
 ├─ package.json
 ├─ .dev.vars.example           ← 로컬 개발용 환경변수 템플릿
 └─ src/
     ├─ index.js                ← 메인 라우터 (GET / 헬스체크, POST 2개 라우팅)
     ├─ prompts/
     │   └─ wingle.js           ← 윙글이 페르소나 + SYSTEM_PROMPT_A/B + buildUserPromptA/B
     ├─ handlers/
     │   ├─ generateVariants.js ← POST /api/generate-variants (프롬프트 A, 1회 재시도)
     │   └─ deepAnalysis.js     ← POST /api/deep-analysis (프롬프트 B, 중복호출 캐시)
     ├─ lib/
     │   ├─ claude.js           ← fetch 기반 Claude API 래퍼 (SDK 미사용)
     │   ├─ supabase.js         ← PostgREST 직접 호출 (insert/getById/update), service_role로 RLS 우회
     │   ├─ validators.js       ← validateStrictA/B, validateSoftA (strict 실패 시 재호출)
     │   ├─ cors.js             ← CORS 헤더, jsonResponse 헬퍼
     │   └─ errors.js           ← 윙글이 톤 에러 응답
     └─ constants/
         └─ messages.js         ← 윙글이 실패 메시지 풀
         (※ v1.1 tarball에는 categories.js 추가됨 — 아직 repo 미반영)

(DB 스키마)
supabase/
 ├─ migrations/
 │   └─ 20260426000001_twing_2_0.sql  ← 기존 스키마 (구버전)
 └─ (신규 스키마는 twing-supabase.tar.gz 5파일로 별도 관리, 로컬 검증 완료)
     ├─ 01_schema.sql  ← 5개 테이블, 인덱스 7개, 트리거 3개
     ├─ 02_rls.sql     ← Row Level Security (클라이언트용)
     ├─ 03_functions.sql ← 핫점수·포인트·등급·첫 등록 보너스
     ├─ 04_seed.sql    ← 윙글이 시드 계정 + 시딩 카드
     └─ 00_test_mock_auth.sql ← 로컬 검증용 (운영 적용 금지)
```
---


