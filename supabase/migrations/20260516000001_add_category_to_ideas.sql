-- ideas 테이블에 category 컬럼 추가
-- Workers generate-variants.js가 Claude 출력에서 추출해 INSERT
-- 클라이언트 src/theme/categories.ts의 Category 타입과 동일한 10개 한글 키

alter table public.ideas
  add column category text
    check (category in ('갓생','힐링','컬처','일상','푸드','스타일','테크','펫','게임','유머'));
