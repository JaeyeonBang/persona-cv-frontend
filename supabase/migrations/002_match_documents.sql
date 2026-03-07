-- 문서 벡터 유사도 검색 함수
-- 사용: supabase.rpc('match_documents', { p_user_id, p_query_embedding, p_match_count })

CREATE OR REPLACE FUNCTION match_documents(
  p_user_id        UUID,
  p_query_embedding vector(1536),
  p_match_count    INT DEFAULT 3
)
RETURNS TABLE (
  id         UUID,
  title      TEXT,
  content    TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    title,
    content,
    1 - (embedding <=> p_query_embedding) AS similarity
  FROM documents
  WHERE
    user_id = p_user_id
    AND status = 'done'
    AND embedding IS NOT NULL
  ORDER BY embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
