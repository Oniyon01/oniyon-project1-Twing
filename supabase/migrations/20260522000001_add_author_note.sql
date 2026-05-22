-- Add author_note column to ideas table
-- Allows authors to write a personal caption when sharing to the feed

ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS author_note TEXT
    CHECK (author_note IS NULL OR char_length(author_note) <= 200);
