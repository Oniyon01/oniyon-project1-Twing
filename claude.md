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



