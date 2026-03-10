import OpenAI from 'openai'
import { env } from '@/lib/env'

const EMBEDDING_DIMS = 1536

function getClient() {
  if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set')
  return new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: env.OPENROUTER_BASE_URL,
  })
}

/**
 * 텍스트를 1536차원 임베딩 벡터로 변환합니다.
 * OpenRouter의 임베딩 엔드포인트를 사용합니다.
 */
export async function embed(text: string): Promise<number[]> {
  const client = getClient()
  const input = text.slice(0, 24000) // 안전하게 잘라냄 (문자 기준)
  const response = await client.embeddings.create({
    model: env.OPENROUTER_EMBEDDING_MODEL,
    input,
  })
  return response.data[0].embedding
}

/**
 * 텍스트를 처리 가능한 청크들로 분할합니다.
 * MVP: 단순 단어 기반 분할, 500단어 청크, 50단어 오버랩
 */
export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end >= words.length) break
    start += chunkSize - overlap
  }

  return chunks
}

export { EMBEDDING_DIMS }
