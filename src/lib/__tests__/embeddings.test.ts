import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: {
    OPENROUTER_API_KEY: 'test-key',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    OPENROUTER_EMBEDDING_MODEL: 'openai/text-embedding-3-small',
    OPENROUTER_MODEL: 'z-ai/glm-4.7-flash',
    FASTAPI_URL: 'http://localhost:8001',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

import { chunkText, EMBEDDING_DIMS } from '@/lib/embeddings'

describe('chunkText', () => {
  it('빈 문자열은 빈 배열 반환', () => {
    expect(chunkText('')).toEqual([])
  })

  it('공백만 있는 문자열은 빈 배열 반환', () => {
    expect(chunkText('   \n\t  ')).toEqual([])
  })

  it('500단어 미만 → 청크 1개', () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`)
    const text = words.join(' ')
    const chunks = chunkText(text)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe(text)
  })

  it('정확히 500단어 → 청크 1개', () => {
    const words = Array.from({ length: 500 }, (_, i) => `w${i}`)
    const chunks = chunkText(words.join(' '))
    expect(chunks).toHaveLength(1)
  })

  it('501단어 → 청크 2개 (오버랩 50)', () => {
    const words = Array.from({ length: 501 }, (_, i) => `w${i}`)
    const chunks = chunkText(words.join(' '))
    expect(chunks).toHaveLength(2)
  })

  it('두 번째 청크는 첫 청크 마지막 50단어로 시작 (오버랩)', () => {
    const words = Array.from({ length: 600 }, (_, i) => `w${i}`)
    const chunks = chunkText(words.join(' '))
    // 첫 청크: w0~w499, 두 번째 청크: w450~w599 (start=450)
    expect(chunks[1].startsWith('w450')).toBe(true)
  })

  it('커스텀 chunkSize / overlap 적용', () => {
    const words = Array.from({ length: 25 }, (_, i) => `w${i}`)
    const chunks = chunkText(words.join(' '), 10, 2)
    // start: 0, 8, 16, 24 → 4청크
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]).toBe(words.slice(0, 10).join(' '))
  })

  it('연속 공백/개행 처리 — 단어로만 분할', () => {
    const chunks = chunkText('a  b\n\nc   d')
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe('a b c d')
  })
})

describe('EMBEDDING_DIMS', () => {
  it('1536 차원', () => {
    expect(EMBEDDING_DIMS).toBe(1536)
  })
})
