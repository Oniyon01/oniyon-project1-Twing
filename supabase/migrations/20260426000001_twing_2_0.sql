-- ============================================================
-- Twing 2.0 — 전체 스키마
-- ============================================================
-- 실행 방법:
--   Supabase SQL Editor에 붙여넣고 실행
--   또는: supabase db push (Supabase CLI)
--
-- 참조:
--   twing-workers/src/handlers/generateVariants.js  ← ideas INSERT
--   twing-workers/src/handlers/deepAnalysis.js       ← ideas SELECT/UPDATE
--   twing_ranking_system.md 8.1~8.3                  ← 핫스코어 / 등급 / 스트릭
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 0. 확장
-- ─────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ─────────────────────────────────────────────────────────
-- 1. users  (auth.users 1:1 프로필)
-- ─────────────────────────────────────────────────────────
-- auth.users 가입 시 트리거로 자동 생성 (섹션 8 참조)
create table public.users (
  id               uuid        primary key references auth.users(id) on delete cascade,
  username         text        not null,
  avatar_url       text,

  -- 포인트 / 등급 (twing_ranking_system.md 8.2)
  points           integer     not null default 0 check (points >= 0),
  grade            text        not null default 'Lv1'
                               check (grade in ('Lv1','Lv2','Lv3','Lv4','Lv5','Lv6')),

  -- 스트릭 (twing_ranking_system.md 8.3)
  streak_days      integer     not null default 0,
  max_streak       integer     not null default 0,
  last_active_date date,

  -- 뱃지 특수 플래그
  is_early_member  boolean     not null default false,  -- 선구자 (초기 100명)

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.users is '인증 유저 공개 프로필 — auth.users 가입 시 트리거로 자동 생성';


-- ─────────────────────────────────────────────────────────
-- 2. ideas  (워커의 핵심 테이블)
-- ─────────────────────────────────────────────────────────
-- generateVariants.js INSERT 컬럼:
--   user_id, core_idea, emotion_tone, participation,
--   differentiator, reference, detected_flavor,
--   inferred_differentiator, variants, is_shared, hot_score
--
-- deepAnalysis.js SELECT 컬럼:
--   id, variants, is_shared, deep_analysis,
--   selected_variant_index, core_idea, emotion_tone, participation
--
-- deepAnalysis.js UPDATE 컬럼:
--   is_shared, selected_variant_index, deep_analysis, shared_at
create table public.ideas (
  id                      uuid          primary key default uuid_generate_v4(),
  user_id                 uuid          not null references public.users(id) on delete cascade,

  -- ── 유저 입력 (generateVariants.js body) ─────────────
  core_idea               text          not null
                                        check (char_length(core_idea) between 2 and 200),
  emotion_tone            text          not null
                                        check (emotion_tone in ('웃김','멋짐','공감','충격','호기심')),
  participation           text          not null
                                        check (participation in ('챌린지','도전형','관전형')),
  differentiator          text          not null default '',
  reference               text,

  -- ── AI 출력 — 프롬프트 A (generateVariants.js) ───────
  detected_flavor         text,
  inferred_differentiator text,
  variants                jsonb,        -- [{angle, challenge_name, hashtags, ...}] × 3

  -- ── 공유 + 심층분석 — 프롬프트 B (deepAnalysis.js) ───
  is_shared               boolean       not null default false,
  selected_variant_index  integer       check (selected_variant_index between 0 and 2),
  deep_analysis           jsonb,        -- why_it_works, platform_plans, scale_playbook ...
  shared_at               timestamptz,

  -- ── 집계 카운터 (트리거로 자동 갱신) ─────────────────
  like_count              integer       not null default 0,
  feedback_count          integer       not null default 0,
  try_vote_count          integer       not null default 0,   -- vote_type='try'
  watch_vote_count        integer       not null default 0,   -- vote_type='watch'
  comment_count           integer       not null default 0,

  -- ── 랭킹 (twing_ranking_system.md 8.1) ──────────────
  hot_score               numeric(10,4) not null default 0,

  -- ── 어뷰징 ───────────────────────────────────────────
  report_count            integer       not null default 0,
  is_hidden               boolean       not null default false,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

comment on column public.ideas.variants        is '프롬프트 A 출력 — variants[3] jsonb 배열';
comment on column public.ideas.deep_analysis   is '프롬프트 B 출력 — why_it_works, platform_plans, scale_playbook 등';
comment on column public.ideas.hot_score       is '핫스코어 = (likes×2 + feedbacks×3 + try×5 + watch×1 + comments×2) × boost / (hours+2)²';


-- ─────────────────────────────────────────────────────────
-- 3. feedbacks  (구조화 피드백 — 아이디어당 1인 1회)
-- ─────────────────────────────────────────────────────────
-- vote_type: 'try'   = "직접 해볼래" (hot_score 가중치 5)
--            'watch' = "보는 건 좋아" (hot_score 가중치 1)
-- content: 선택적 서면 피드백 (10자 이상)
create table public.feedbacks (
  id          uuid        primary key default uuid_generate_v4(),
  idea_id     uuid        not null references public.ideas(id) on delete cascade,
  user_id     uuid        not null references public.users(id) on delete cascade,

  vote_type   text        not null check (vote_type in ('try','watch')),
  content     text        check (content is null or char_length(content) >= 10),

  created_at  timestamptz not null default now(),

  unique (idea_id, user_id)   -- 아이디어당 피드백 1회
);


-- ─────────────────────────────────────────────────────────
-- 4. comments  (자유 댓글)
-- ─────────────────────────────────────────────────────────
create table public.comments (
  id          uuid        primary key default uuid_generate_v4(),
  idea_id     uuid        not null references public.ideas(id) on delete cascade,
  user_id     uuid        not null references public.users(id) on delete cascade,

  content     text        not null check (char_length(content) between 1 and 500),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────
-- 5. likes  (좋아요 — 아이디어당 1인 1회)
-- ─────────────────────────────────────────────────────────
create table public.likes (
  id          uuid        primary key default uuid_generate_v4(),
  idea_id     uuid        not null references public.ideas(id) on delete cascade,
  user_id     uuid        not null references public.users(id) on delete cascade,

  created_at  timestamptz not null default now(),

  unique (idea_id, user_id)   -- 아이디어당 좋아요 1회
);


-- ─────────────────────────────────────────────────────────
-- 6. 인덱스
-- ─────────────────────────────────────────────────────────

-- 피드 메인 쿼리: 공유된 아이디어, 핫스코어 DESC
create index idx_ideas_feed
  on public.ideas (hot_score desc, created_at desc)
  where is_shared = true and is_hidden = false;

-- 오늘의 TOP / 이번 주 랭킹
create index idx_ideas_shared_at
  on public.ideas (shared_at desc)
  where shared_at is not null and is_hidden = false;

-- 마이페이지: 내 아이디어 목록
create index idx_ideas_user_id
  on public.ideas (user_id, created_at desc);

-- deepAnalysis.js: getById 조회 (이미 PK로 커버되지만 명시)
-- idea.id는 PK — 별도 인덱스 불필요

-- 피드백 목록
create index idx_feedbacks_idea_id on public.feedbacks (idea_id);
create index idx_feedbacks_user_id on public.feedbacks (user_id);

-- 댓글 목록 (최신순)
create index idx_comments_idea_id  on public.comments (idea_id, created_at desc);
create index idx_comments_user_id  on public.comments (user_id);

-- 좋아요 여부 확인 (내가 이미 눌렀는지)
create index idx_likes_idea_user   on public.likes (idea_id, user_id);
create index idx_likes_user_id     on public.likes (user_id);


-- ─────────────────────────────────────────────────────────
-- 7. 함수 — hot_score 계산 (twing_ranking_system.md 8.1)
-- ─────────────────────────────────────────────────────────
-- baseScore = likes×2 + feedbacks×3 + tryVotes×5 + watchVotes×1 + comments×2
-- hotScore  = (baseScore × newUserBoost × multiplier) / (hoursAgo + 2)²
create or replace function calc_hot_score(
  p_likes          integer,
  p_feedbacks      integer,
  p_try_votes      integer,
  p_watch_votes    integer,
  p_comments       integer,
  p_created_at     timestamptz,
  p_new_user_boost boolean     default false,
  p_multiplier     numeric     default 1.0
) returns numeric as $$
declare
  v_hours_ago  numeric;
  v_base_score numeric;
  v_boost      numeric;
begin
  v_hours_ago  := extract(epoch from (now() - p_created_at)) / 3600.0;
  v_boost      := case when p_new_user_boost then 1.3 else 1.0 end;
  v_base_score := (
    p_likes       * 2 +
    p_feedbacks   * 3 +
    p_try_votes   * 5 +
    p_watch_votes * 1 +
    p_comments    * 2
  )::numeric;
  return round(
    (v_base_score * v_boost * p_multiplier) / power(v_hours_ago + 2, 2),
    4
  );
end;
$$ language plpgsql immutable;


-- ─────────────────────────────────────────────────────────
-- 8. 함수 — 등급 계산 (twing_ranking_system.md 8.2)
-- ─────────────────────────────────────────────────────────
-- Lv1 트린이:  0pt       Lv4 윙터치:  4,000pt
-- Lv2 윙눈이:  300pt     Lv5 골드윙:  10,000pt
-- Lv3 윙이어:  1,200pt   Lv6 트윙글:  30,000pt
create or replace function points_to_grade(p_points integer)
returns text as $$
begin
  return case
    when p_points >= 30000 then 'Lv6'
    when p_points >= 10000 then 'Lv5'
    when p_points >=  4000 then 'Lv4'
    when p_points >=  1200 then 'Lv3'
    when p_points >=   300 then 'Lv2'
    else                        'Lv1'
  end;
end;
$$ language plpgsql immutable;


-- ─────────────────────────────────────────────────────────
-- 9. 트리거 함수
-- ─────────────────────────────────────────────────────────

-- 9-1. auth.users 가입 → users 프로필 자동 생성
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- 9-2. hot_score 갱신 헬퍼 (is_shared=true인 아이디어에만 적용)
-- 가입 3일 이내 + 첫 공유 아이디어면 1.3× 부스트
create or replace function refresh_hot_score(p_idea_id uuid) returns void as $$
declare
  v           public.ideas%rowtype;
  v_new_boost boolean := false;
begin
  select * into v from public.ideas where id = p_idea_id;
  if not found or not v.is_shared then return; end if;

  select (
    v.shared_at is not null
    and extract(epoch from (v.shared_at - u.created_at)) / 86400.0 < 3
  )
  into v_new_boost
  from public.users u
  where u.id = v.user_id;

  update public.ideas
  set
    hot_score  = calc_hot_score(
                   v.like_count, v.feedback_count,
                   v.try_vote_count, v.watch_vote_count, v.comment_count,
                   v.created_at, coalesce(v_new_boost, false)
                 ),
    updated_at = now()
  where id = p_idea_id;
end;
$$ language plpgsql security definer;


-- 9-3. likes INSERT/DELETE → like_count + hot_score
create or replace function handle_like_change() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.ideas
    set like_count = like_count + 1
    where id = new.idea_id;
    perform refresh_hot_score(new.idea_id);
    return new;

  elsif TG_OP = 'DELETE' then
    update public.ideas
    set like_count = greatest(like_count - 1, 0)
    where id = old.idea_id;
    perform refresh_hot_score(old.idea_id);
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger trg_likes_change
  after insert or delete on public.likes
  for each row execute procedure handle_like_change();


-- 9-4. feedbacks INSERT/DELETE → feedback_count + try/watch + hot_score
create or replace function handle_feedback_change() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.ideas
    set
      feedback_count   = feedback_count + 1,
      try_vote_count   = try_vote_count   + (case when new.vote_type = 'try'   then 1 else 0 end),
      watch_vote_count = watch_vote_count + (case when new.vote_type = 'watch' then 1 else 0 end)
    where id = new.idea_id;
    perform refresh_hot_score(new.idea_id);
    return new;

  elsif TG_OP = 'DELETE' then
    update public.ideas
    set
      feedback_count   = greatest(feedback_count - 1, 0),
      try_vote_count   = greatest(try_vote_count   - (case when old.vote_type = 'try'   then 1 else 0 end), 0),
      watch_vote_count = greatest(watch_vote_count - (case when old.vote_type = 'watch' then 1 else 0 end), 0)
    where id = old.idea_id;
    perform refresh_hot_score(old.idea_id);
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger trg_feedbacks_change
  after insert or delete on public.feedbacks
  for each row execute procedure handle_feedback_change();


-- 9-5. comments INSERT/DELETE → comment_count + hot_score
create or replace function handle_comment_change() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.ideas
    set comment_count = comment_count + 1
    where id = new.idea_id;
    perform refresh_hot_score(new.idea_id);
    return new;

  elsif TG_OP = 'DELETE' then
    update public.ideas
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.idea_id;
    perform refresh_hot_score(old.idea_id);
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger trg_comments_change
  after insert or delete on public.comments
  for each row execute procedure handle_comment_change();


-- 9-6. users.points 변경 → grade 자동 동기화 + updated_at
create or replace function sync_user_fields() returns trigger as $$
begin
  new.grade      := points_to_grade(new.points);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_sync
  before update on public.users
  for each row execute procedure sync_user_fields();


-- ─────────────────────────────────────────────────────────
-- 10-A. 포인트 지급 헬퍼 함수
-- ─────────────────────────────────────────────────────────
-- 활동에 따라 users.points를 증가.
-- grade는 trg_users_sync 트리거가 자동 갱신하므로 여기서는 points만 업데이트.
create or replace function add_points(
  user_id_param uuid,
  amount        integer,
  reason        text default null
) returns integer as $$
declare
  v_new_points integer;
begin
  update public.users
  set points = points + amount
  where id = user_id_param
  returning points into v_new_points;

  if v_new_points is null then
    raise exception 'user not found: %', user_id_param;
  end if;

  return v_new_points;
end;
$$ language plpgsql security definer;

comment on function add_points is '포인트 지급 + trg_users_sync 트리거로 grade 자동 갱신. 워커나 트리거에서 호출.';


-- ─────────────────────────────────────────────────────────
-- 10-B. 첫 아이디어 등록 → onboarding 보너스 + 일반 등록 포인트
-- ─────────────────────────────────────────────────────────
-- ideas INSERT 시 자동 실행. 첫 아이디어면 +20pt 보너스, 항상 +10pt.
create or replace function handle_first_idea() returns trigger as $$
declare
  v_prior_count integer;
begin
  -- 이번 INSERT 제외한 이전 아이디어 수로 "첫 아이디어" 여부 판단
  select count(*) into v_prior_count
  from public.ideas
  where user_id = new.user_id
    and id != new.id;

  if v_prior_count = 0 then
    -- 첫 아이디어 보너스 +20pt (랭킹 문서 "첫 아이디어 등록 +20" 그대로)
    perform add_points(new.user_id, 20, 'first_idea_bonus');
  end if;

  -- 일반 아이디어 등록 +10pt
  perform add_points(new.user_id, 10, 'idea_post');

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_first_idea_bonus
  after insert on public.ideas
  for each row execute procedure handle_first_idea();


-- 9-7. ideas / comments updated_at 자동 갱신
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row execute procedure set_updated_at();

create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute procedure set_updated_at();


-- ─────────────────────────────────────────────────────────
-- 10. RLS 활성화
-- ─────────────────────────────────────────────────────────
-- 주의: Cloudflare Worker는 SUPABASE_SERVICE_KEY를 사용하므로
--       RLS를 완전히 우회함 — 아래 정책은 프론트엔드 직접 호출용
alter table public.users     enable row level security;
alter table public.ideas     enable row level security;
alter table public.feedbacks enable row level security;
alter table public.comments  enable row level security;
alter table public.likes     enable row level security;


-- ─────────────────────────────────────────────────────────
-- 11. RLS 정책
-- ─────────────────────────────────────────────────────────

-- ── users ────────────────────────────────────────────────

-- 누구나 프로필 조회 (username, grade, points 등 공개 정보)
create policy "users: public read"
  on public.users for select
  using (true);

-- 본인 프로필만 수정
create policy "users: self update"
  on public.users for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT는 handle_new_user() 트리거(security definer)에서만 처리


-- ── ideas ────────────────────────────────────────────────

-- 공개된 아이디어는 누구나 조회
-- 본인 아이디어는 공유 전에도 조회 가능 (생성 직후 결과 화면)
create policy "ideas: read"
  on public.ideas for select
  using (
    (is_shared = true and is_hidden = false)
    or (auth.uid() = user_id)
  );

-- 인증 유저는 본인 user_id로만 삽입
-- (Worker는 service key로 우회하므로 실질적으론 Worker 경유가 기본)
create policy "ideas: authenticated insert"
  on public.ideas for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 본인 아이디어만 수정 (프론트가 직접 PATCH하는 경우 대비)
create policy "ideas: self update"
  on public.ideas for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── feedbacks ────────────────────────────────────────────

-- 공개된 아이디어의 피드백 + 본인 피드백은 항상 조회
create policy "feedbacks: read"
  on public.feedbacks for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.ideas i
      where i.id = idea_id
        and i.is_shared = true
        and i.is_hidden = false
    )
  );

-- 인증 유저만 작성 (본인 명의로만)
create policy "feedbacks: authenticated insert"
  on public.feedbacks for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 본인 피드백만 삭제
create policy "feedbacks: self delete"
  on public.feedbacks for delete
  using (auth.uid() = user_id);


-- ── comments ─────────────────────────────────────────────

-- 공개된 아이디어의 댓글 + 본인 댓글은 항상 조회
create policy "comments: read"
  on public.comments for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.ideas i
      where i.id = idea_id
        and i.is_shared = true
        and i.is_hidden = false
    )
  );

-- 인증 유저만 작성
create policy "comments: authenticated insert"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 본인 댓글만 수정
create policy "comments: self update"
  on public.comments for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 본인 댓글만 삭제
create policy "comments: self delete"
  on public.comments for delete
  using (auth.uid() = user_id);


-- ── likes ────────────────────────────────────────────────

-- 누구나 좋아요 현황 조회 (내가 눌렀는지 확인 포함)
create policy "likes: public read"
  on public.likes for select
  using (true);

-- 인증 유저만 좋아요 (본인 명의로만)
create policy "likes: authenticated insert"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 본인 좋아요만 취소
create policy "likes: self delete"
  on public.likes for delete
  using (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 12. Realtime 활성화 (피드 실시간 갱신용)
-- 이미 등록된 테이블은 조용히 skip
-- ─────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['public.ideas','public.feedbacks','public.comments','public.likes']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname || '.' || tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %s', t);
    end if;
  end loop;
end;
$$;
