-- ============================================================
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. Realtime 활성화 (투표 실시간 반영 + 새 트렌드 자동 표시)
ALTER PUBLICATION supabase_realtime ADD TABLE trends;

-- 2. comments 테이블
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id   UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Anyone can insert comments"
  ON comments FOR INSERT WITH CHECK (true);
