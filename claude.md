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

---

## 3일차 (2026-04-03)

### 작업 내용
1. **Wingy 캐릭터 UI 통합**
   - `Wingy.ico` → favicon 적용, 페이지 타이틀 "Twing — 트렌드를 날개로"로 변경
   - Wingy 배경제거 이미지 2종 (`wingy.png` 2D 일러스트, `wingy-3d.png` 3D 렌더) → `public/`에 배치
   - 헤더: Wingy 이미지 + 핑크×블루 그라데이션 로고 추가
   - 색상 테마 전환: 인디고(`#6366f1`) → Wingy 시그니처 핑크(`#f9a8d4`)·블루(`#93c5fd`) 그라데이션

2. **3단계 세션 플로우 구현**
   - `IntroScreen` — Wingy 3D 전체화면, 타이핑 애니메이션("오늘은 무엇이 유행하고 있는지 날아가볼까?"), 플로팅 효과
   - `CategoryRanking` — 카테고리 탭별 트렌드 순위 (🔥챌린지/☕카페·푸드/✈️여행/🌿라이프/🤖테크), 금은동 배지 + 바 차트
   - `App.tsx` — `session` 상태(`intro` → `categories` → `feed`)로 3단계 전환
   - 트렌드 데이터 3개 → 9개로 확장, `category` 필드 추가

3. **윙이로그 피드 페이지 개선**
   - 헤더 좌측 "← 순위 보기" 뒤로가기 버튼 추가
   - 피드 우측 `RankingPanel` 사이드패널 고정 (카테고리 탭 + 바 차트)
   - 피드 정중앙 정렬 — `panel-spacer`로 좌우 균형 보정
   - 모바일 반응형: 패널이 피드 하단으로 내려오는 처리

4. **용어 통일**
   - "트렌드카드" → "윙이로그"로 전면 교체

### 트러블슈팅
- **mockTrends.ts `category` 누락** — `Trend` 타입에 `category` 필드 추가 후 `mockTrends.ts` 미업데이트로 빌드 실패 → 필드 추가로 해결
- **Cloudflare 빌드 실패** — 기본 Node.js 버전이 낮아 Vite 8 + React 19 호환 안됨 → `.node-version` 파일(`20`) + `package.json engines` 필드로 해결
- **날아가기 이모지 깨짐** — `🪽`(U+1FABD) 일부 환경 미지원 → `🕊️`로 교체

### 현재 구조
```
src/
 ├─ App.tsx                  ← 세션 상태 관리 (intro/categories/feed)
 ├─ styles.css
 ├─ components/
 │   ├─ IntroScreen.tsx/css  ← 1단계: Wingy 인트로
 │   ├─ CategoryRanking.tsx/css ← 2단계: 카테고리 순위
 │   ├─ Feed.tsx             ← 3단계: 윙이로그 피드
 │   ├─ TrendCard.tsx/css    ← 개별 윙이로그 카드
 │   ├─ VoteButtons.tsx
 │   └─ RankingPanel.tsx/css ← 피드 우측 순위 사이드패널
 ├─ data/
 │   ├─ trends.ts            ← 9개 트렌드 (카테고리 포함)
 │   └─ mockTrends.ts
 └─ types/
     └─ index.ts             ← Trend, VoteType, Category, CategoryMeta
```

### 다음 작업 후보
- Supabase 연동 (투표 결과 저장, 실제 DB 데이터)
- 윙이로그 무한 스크롤 / 추가 데이터 로드
- 공유하기 기능 (카카오/링크 복사)
