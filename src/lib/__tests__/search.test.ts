import { describe, it, expect } from 'vitest'
import { buildContext } from '@/lib/search'
import type { SearchResult } from '@/lib/search'

const makeResult = (id: string, title: string, content: string, similarity: number): SearchResult => ({
  id,
  title,
  content,
  similarity,
})

describe('buildContext', () => {
  it('결과 없으면 빈 문자열 반환', () => {
    expect(buildContext([])).toBe('')
  })

  it('모든 결과가 임계값(0.3) 미만이면 빈 문자열', () => {
    const results = [
      makeResult('1', 'A', 'content', 0.1),
      makeResult('2', 'B', 'content', 0.29),
    ]
    expect(buildContext(results)).toBe('')
  })

  it('임계값 이상인 결과만 포함', () => {
    const results = [
      makeResult('1', 'Pass', 'pass content', 0.5),
      makeResult('2', 'Fail', 'fail content', 0.1),
    ]
    const ctx = buildContext(results)
    expect(ctx).toContain('Pass')
    expect(ctx).not.toContain('Fail')
  })

  it('정확히 임계값(0.3)인 결과 포함', () => {
    const results = [makeResult('1', 'Edge', 'edge content', 0.3)]
    expect(buildContext(results)).toContain('Edge')
  })

  it('번호와 제목 형식으로 포맷 — [1] Title', () => {
    const results = [makeResult('1', 'My Doc', 'some content', 0.8)]
    const ctx = buildContext(results)
    expect(ctx).toContain('[1] My Doc')
  })

  it('여러 결과는 --- 구분자로 연결', () => {
    const results = [
      makeResult('1', 'A', 'content a', 0.9),
      makeResult('2', 'B', 'content b', 0.8),
    ]
    const ctx = buildContext(results)
    expect(ctx).toContain('---')
    expect(ctx).toContain('[1] A')
    expect(ctx).toContain('[2] B')
  })

  it('content 1500자 초과 시 자름', () => {
    const longContent = 'x'.repeat(2000)
    const results = [makeResult('1', 'Long', longContent, 0.9)]
    const ctx = buildContext(results)
    expect(ctx).not.toContain('x'.repeat(1501))
    expect(ctx).toContain('x'.repeat(1500))
  })

  it('커스텀 임계값 적용', () => {
    const results = [
      makeResult('1', 'High', 'content', 0.8),
      makeResult('2', 'Low', 'content', 0.4),
    ]
    const ctx = buildContext(results, 0.6)
    expect(ctx).toContain('High')
    expect(ctx).not.toContain('Low')
  })
})
