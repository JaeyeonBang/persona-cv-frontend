-- Phase 10: Pinned Q&A (예상 질문 + 사전 답변)
CREATE TABLE IF NOT EXISTS pinned_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pinned_qa_user_id_idx ON pinned_qa (user_id, display_order);

ALTER TABLE pinned_qa ENABLE ROW LEVEL SECURITY;

-- 방문자도 읽을 수 있음 (공개 페르소나)
CREATE POLICY "pinned_qa_read_all" ON pinned_qa
  FOR SELECT USING (true);

-- Owner만 쓰기 가능
CREATE POLICY "pinned_qa_owner_write" ON pinned_qa
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );
