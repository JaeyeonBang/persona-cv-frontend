import { createAdminClient } from '@/lib/supabase/admin'

export type SearchResult = {
  id: string
  title: string
  content: string
  similarity: number
}

/**
 * pgvector 코사인 유사도 검색.
 * status = 'done' 이고 embedding이 있는 문서만 검색합니다.
 */
export async function searchDocuments(
  userId: string,
  queryEmbedding: number[],
  limit = 3,
): Promise<SearchResult[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('match_documents', {
    p_user_id: userId,
    p_query_embedding: queryEmbedding,
    p_match_count: limit,
  })

  if (error) throw new Error(`Vector search failed: ${error.message}`)
  return (data ?? []) as SearchResult[]
}

/**
 * 검색 결과를 LLM 컨텍스트 문자열로 조합합니다.
 * 유사도 임계값(0.3) 이하 결과는 제외합니다.
 */
export function buildContext(results: SearchResult[], threshold = 0.3): string {
  const relevant = results.filter((r) => r.similarity >= threshold)
  if (relevant.length === 0) return ''

  return relevant
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content.slice(0, 1500)}`)
    .join('\n\n---\n\n')
}
