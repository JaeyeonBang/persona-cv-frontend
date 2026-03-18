-- Phase 12: 대화 피드백 (1 = 좋아요, -1 = 별로예요)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS feedback smallint
  CHECK (feedback IN (-1, 1));

-- Phase 14: 방문자 페이지 테마
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'default'
  CHECK (theme IN ('default', 'tech', 'creative', 'business'));
