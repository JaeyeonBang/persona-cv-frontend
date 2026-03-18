-- Phase 16: 방문자 페이지 뷰 카운터
ALTER TABLE users ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 뷰 카운트 원자적 증가 함수 (RLS 우회 가능하도록 SECURITY DEFINER)
CREATE OR REPLACE FUNCTION increment_view_count(p_username TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET view_count = view_count + 1 WHERE username = p_username;
END;
$$;
