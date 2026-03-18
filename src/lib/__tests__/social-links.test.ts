import { describe, it, expect } from 'vitest'
import type { Document } from '../types'

// visitor-page.tsx에서 추출할 순수 함수 — 동일 로직 재정의해 테스트
type SocialLink = { type: 'github' | 'linkedin'; url: string; title: string }

function extractSocialLinks(documents: Document[]): SocialLink[] {
  return documents
    .filter(
      (d): d is Document & { source_url: string } =>
        (d.type === 'github' || d.type === 'linkedin') && !!d.source_url,
    )
    .map((d) => ({ type: d.type as 'github' | 'linkedin', url: d.source_url, title: d.title }))
}

function makeDoc(overrides: Partial<Document>): Document {
  return {
    id: '1',
    user_id: 'u1',
    type: 'pdf',
    title: '',
    source_url: null,
    content: '',
    status: 'done',
    error_message: null,
    created_at: '2026-01-01',
    ...overrides,
  }
}

describe('extractSocialLinks', () => {
  it('빈 documents → 빈 배열', () => {
    expect(extractSocialLinks([])).toEqual([])
  })

  it('github 문서에서 링크 추출', () => {
    const docs = [makeDoc({ type: 'github', source_url: 'https://github.com/dev', title: 'GitHub' })]
    const result = extractSocialLinks(docs)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'github', url: 'https://github.com/dev', title: 'GitHub' })
  })

  it('linkedin 문서에서 링크 추출', () => {
    const docs = [makeDoc({ type: 'linkedin', source_url: 'https://linkedin.com/in/dev', title: 'LinkedIn' })]
    const result = extractSocialLinks(docs)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('linkedin')
  })

  it('source_url이 null인 소셜 문서는 제외', () => {
    const docs = [makeDoc({ type: 'github', source_url: null })]
    expect(extractSocialLinks(docs)).toHaveLength(0)
  })

  it('pdf / url / other 타입은 포함하지 않는다', () => {
    const docs = [
      makeDoc({ type: 'pdf', source_url: 'https://example.com/cv.pdf' }),
      makeDoc({ type: 'url', source_url: 'https://portfolio.com' }),
      makeDoc({ type: 'other', source_url: 'https://other.com' }),
    ]
    expect(extractSocialLinks(docs)).toHaveLength(0)
  })

  it('github + linkedin 모두 있을 때 둘 다 반환', () => {
    const docs = [
      makeDoc({ type: 'github', source_url: 'https://github.com/dev', title: 'GitHub' }),
      makeDoc({ type: 'linkedin', source_url: 'https://linkedin.com/in/dev', title: 'LinkedIn' }),
    ]
    const result = extractSocialLinks(docs)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.type)).toContain('github')
    expect(result.map((r) => r.type)).toContain('linkedin')
  })

  it('여러 github 문서가 있으면 모두 반환', () => {
    const docs = [
      makeDoc({ id: '1', type: 'github', source_url: 'https://github.com/dev1', title: 'GitHub 1' }),
      makeDoc({ id: '2', type: 'github', source_url: 'https://github.com/dev2', title: 'GitHub 2' }),
    ]
    expect(extractSocialLinks(docs)).toHaveLength(2)
  })
})
