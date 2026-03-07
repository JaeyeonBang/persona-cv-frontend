-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users (Owner profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,                          -- Supabase auth.users.id
  username TEXT UNIQUE NOT NULL,                -- 명함 URL slug (e.g. /minjun)
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',               -- 직책
  bio TEXT NOT NULL DEFAULT '',                 -- 한줄 소개
  photo_url TEXT,
  persona_config JSONB NOT NULL DEFAULT '{
    "preset": "professional",
    "custom_prompt": "",
    "default_interviewer": {
      "answer_length": "medium",
      "language": "ko",
      "speech_style": "formal",
      "question_style": "free",
      "show_citation": true
    },
    "suggested_questions": []
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents (uploaded files / URLs)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'url', 'github', 'linkedin', 'other')),
  title TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  content TEXT NOT NULL DEFAULT '',
  embedding vector(1536),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations (Q&A history + cache)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  question_embedding vector(1536),
  answer TEXT NOT NULL DEFAULT '',
  context_used JSONB,                           -- 검색에 사용된 문서/그래프 노드
  interviewer_config JSONB,                     -- 해당 답변 시 Interviewer 설정값
  is_cached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_session_id_idx ON conversations(session_id);
CREATE INDEX IF NOT EXISTS conversations_question_embedding_idx ON conversations USING ivfflat (question_embedding vector_cosine_ops);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
