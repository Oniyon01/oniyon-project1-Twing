# CLAUDE.md

## 제품 문서
- PRD: `Twing_2.0_PRD(updated).md` 참고 (제품 개요, 핵심 기능, 기술 스택, 개발 로드맵 포함)

## 배포
- 배포 = git push (Cloudflare Pages 자동 배포)

## 기술 스택
- Frontend: React (Vite)
- Backend: Cloudflare Workers
- DB: Supabase
- Storage: Cloudflare R2

---

## 1일차 (2026-04-01)

### 작업 내용
1. **프로젝트 초기 세팅** — Vite + React + TypeScript 환경 구성 (`npm create vite@latest`)
2. **초기 화면 구현** — PRD 기반 UI 컴포넌트 작성
   - `TrendCard` — 윙이 말풍선, 트렌드 이미지, 해시태그, 투표 버튼(👍/👎/🤔), 투표 결과 바, 댓글 토글
   - `RankingPanel` — 긍정 투표 비율 기반 트렌드 랭킹 패널
   - 더미 데이터 3개 (`mockTrends.ts`)
   - 다크 테마 전체 스타일링
3. **배포 (Cloudflare Pages)** — git push → 자동 배포 연동
4. **빌드 에러 수정** — `verbatimModuleSyntax` 설정으로 인한 `import type` 오류 해결 후 재배포

### 트러블슈팅
- **원인:** TypeScript `verbatimModuleSyntax` 활성화 상태에서 타입을 일반 `import`로 가져와 빌드 실패 → `import type`으로 수정

---

## 2일차 (2026-04-02)

### 작업 내용
1. **PRD 문서 업데이트** — `Twing_2.0_PRD(updated).md`로 교체, `claude.md` 참조 경로 수정
2. **컴포넌트 구조 재편** — PRD 기반 디렉토리 구조로 리팩토링
   - `Feed.tsx` 신규 — 트렌드 목록 렌더링 (App에서 분리)
   - `VoteButtons.tsx` 신규 — 투표 버튼 + 결과 바 (TrendCard에서 분리)
   - `src/data/trends.ts` — 데이터 파일 정리 (`mockTrends.ts` 대체)
   - `src/styles.css` — 분산된 CSS 파일 통합 (`index.css`, `App.css`, `TrendCard.css`)
   - `App.tsx` 단순화 — Feed 컴포넌트만 렌더링
3. **배포** — git push → Cloudflare Pages 자동 배포

### 현재 구조
```
src/
 ├─ App.tsx
 ├─ styles.css
 ├─ components/
 │   ├─ Feed.tsx
 │   ├─ TrendCard.tsx
 │   ├─ VoteButtons.tsx
 │   └─ RankingPanel.tsx
 ├─ data/
 │   └─ trends.ts
 └─ types/
     └─ index.ts
```

### 다음 작업 후보
- Supabase 연동 (투표 결과 저장, 실제 DB 데이터)
- 풀스크린 TikTok 스타일 피드 UI
- 윙이 캐릭터 이미지 적용
