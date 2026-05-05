-- ============================================================
-- Twing 2.0 - Supabase Schema
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. trends 테이블 생성
CREATE TABLE IF NOT EXISTS trends (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  hashtag     TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url   TEXT NOT NULL DEFAULT '',
  ai_comment  TEXT NOT NULL DEFAULT '',
  created_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT NOT NULL CHECK (category IN ('lifestyle', 'cafe', 'travel', 'challenge', 'tech')),
  votes_yes   INTEGER NOT NULL DEFAULT 0,
  votes_no    INTEGER NOT NULL DEFAULT 0,
  votes_maybe INTEGER NOT NULL DEFAULT 0
);

-- 2. RLS 활성화 + anon 읽기 허용
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trends"
  ON trends FOR SELECT USING (true);

-- 3. 투표 카운트 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_vote(p_trend_id UUID, p_vote_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_vote_type = 'yes' THEN
    UPDATE trends SET votes_yes   = votes_yes   + 1 WHERE id = p_trend_id;
  ELSIF p_vote_type = 'no' THEN
    UPDATE trends SET votes_no    = votes_no    + 1 WHERE id = p_trend_id;
  ELSIF p_vote_type = 'maybe' THEN
    UPDATE trends SET votes_maybe = votes_maybe + 1 WHERE id = p_trend_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_vote TO anon;

-- 4. 시드 데이터 삽입
INSERT INTO trends (title, hashtag, description, image_url, ai_comment, created_at, category, votes_yes, votes_no, votes_maybe) VALUES
('무지출 챌린지',   '#무지출챌린지', '하루 동안 돈을 한 푼도 쓰지 않는 챌린지. SNS에서 인증샷이 급증 중이라는데...',               'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80', '요즘 피드에서 엄청 보이던데? 이거 진짜 유행 맞아? 🤔',                     '2026-04-01', 'challenge', 142, 38,  61),
('수면 카페',       '#수면카페',     '낮잠을 자러 카페에 간다? 조용하고 어두운 분위기의 수면 특화 카페가 뜨고 있다.',             'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80', '나는 카페 가면 커피 마시는데... 이제 자러 가는 거야?? 😴',                  '2026-04-01', 'cafe',      89,  54,  97),
('디지털 디톡스 여행','#디지털디톡스','스마트폰 없이 떠나는 여행. 오히려 SNS에서 인증하는 아이러니한 트렌드.',                   'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80', '폰 없이 여행 간 걸 폰으로 올린다고?! 이게 맞아?! 🤯',                      '2026-04-01', 'travel',    201, 112, 44),
('혼밥 오마카세',   '#혼밥오마카세', '혼자서 오마카세 식당을 찾아다니는 문화. 1인 코스 전문 식당도 늘고 있다.',                  'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&q=80', '혼자 먹는 게 이제 힙한 거야? 나도 혼자 밥 잘 먹는데! 🍱',                  '2026-04-02', 'cafe',      174, 29,  88),
('반려식물 테라리움','#테라리움',    '작은 유리 용기 안에 생태계를 꾸미는 취미. 인테리어와 힐링을 동시에.',                       'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=600&q=80', '식물한테 말 걸어본 적 있어? 나는 있어... 🌿',                              '2026-04-02', 'lifestyle', 118, 22,  76),
('로컬 투어리즘',   '#로컬여행',    '멀리 가지 않고 내 동네를 여행자 시선으로 탐험하는 새로운 여행 방식.',                       'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80', '집 앞 골목도 여행지가 될 수 있어! 나는 매일 탐험 중 🗺️',                   '2026-04-02', 'travel',    156, 41,  62),
('갓생 루틴 공유',  '#갓생',        '새벽 5시 기상, 운동, 독서... 완벽한 하루 루틴을 공유하는 챌린지.',                          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', '새벽 5시... 나는 그 시간에 꿈 속에서 날고 있는데 🌅',                       '2026-04-02', 'challenge', 233, 67,  95),
('AI 아바타 프로필','#AI프로필',    'AI로 만든 나만의 아바타를 SNS 프로필로 쓰는 트렌드. 원하는 스타일로 변신 가능.',             'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80', 'AI가 만든 나? 나도 AI인데 우리 친구 하자! 🤖',                             '2026-04-03', 'tech',      189, 55,  103),
('미니멀 인테리어', '#미니멀라이프', '물건을 줄이고 공간을 넓게 쓰는 미니멀 라이프. 정리 유튜버들이 폭발적으로 늘었다.',          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', '짐이 적으면 날기 더 쉬운데! 나는 이미 가벼워~ 🪶',                         '2026-04-03', 'lifestyle', 145, 33,  58);
