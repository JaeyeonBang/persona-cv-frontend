import { describe, it, expect } from 'vitest'
import { calcCompleteness, type CompletenessItem } from '../profile-completeness'
import type { Document, PinnedQA } from '../types'

function makeUser(overrides = {}) {
  return { name: '', title: '', bio: '', photo_url: null, ...overrides }
}
function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: '1', user_id: 'u1', type: 'pdf', title: 'doc', source_url: null,
    content: '', status: 'done', error_message: null, created_at: '2026-01-01', ...overrides,
  }
}
function makeQA(overrides: Partial<PinnedQA> = {}): PinnedQA {
  return {
    id: '1', user_id: 'u1', question: 'q', answer: 'a', display_order: 0,
    created_at: '2026-01-01', updated_at: '2026-01-01', ...overrides,
  }
}

describe('calcCompleteness', () => {
  it('모두 비어있으면 0%', () => {
    const { percent } = calcCompleteness(makeUser(), [], [])
    expect(percent).toBe(0)
  })

  it('모두 완료하면 100%', () => {
    const user = makeUser({ name: '김민준', title: 'Dev', bio: '개발자', photo_url: 'https://img' })
    const docs = [
      makeDoc({ type: 'pdf', source_url: 'https://cv.pdf' }),
      makeDoc({ type: 'github', source_url: 'https://github.com/dev' }),
    ]
    const qa = [makeQA()]
    const { percent } = calcCompleteness(user, docs, qa)
    expect(percent).toBe(100)
  })

  it('name+title 없으면 name 항목이 false', () => {
    const { items } = calcCompleteness(makeUser(), [], [])
    const nameItem = items.find((i) => i.key === 'name')!
    expect(nameItem.done).toBe(false)
  })

  it('name만 있고 title 없으면 name 항목이 false', () => {
    const { items } = calcCompleteness(makeUser({ name: '김민준', title: '' }), [], [])
    expect(items.find((i) => i.key === 'name')!.done).toBe(false)
  })

  it('name+title 모두 있으면 name 항목이 true', () => {
    const { items } = calcCompleteness(makeUser({ name: '김민준', title: 'Dev' }), [], [])
    expect(items.find((i) => i.key === 'name')!.done).toBe(true)
  })

  it('photo_url 있으면 photo 항목이 true', () => {
    const { items } = calcCompleteness(makeUser({ photo_url: 'https://img' }), [], [])
    expect(items.find((i) => i.key === 'photo')!.done).toBe(true)
  })

  it('pdf 문서가 있으면 document 항목이 true', () => {
    const { items } = calcCompleteness(makeUser(), [makeDoc({ type: 'pdf' })], [])
    expect(items.find((i) => i.key === 'document')!.done).toBe(true)
  })

  it('github/linkedin만 있으면 document 항목이 false', () => {
    const docs = [makeDoc({ type: 'github', source_url: 'https://github.com/dev' })]
    const { items } = calcCompleteness(makeUser(), docs, [])
    expect(items.find((i) => i.key === 'document')!.done).toBe(false)
  })

  it('github source_url 있으면 social 항목이 true', () => {
    const docs = [makeDoc({ type: 'github', source_url: 'https://github.com/dev' })]
    const { items } = calcCompleteness(makeUser(), docs, [])
    expect(items.find((i) => i.key === 'social')!.done).toBe(true)
  })

  it('github source_url null이면 social 항목이 false', () => {
    const docs = [makeDoc({ type: 'github', source_url: null })]
    const { items } = calcCompleteness(makeUser(), docs, [])
    expect(items.find((i) => i.key === 'social')!.done).toBe(false)
  })

  it('QA 1개 이상이면 qa 항목이 true', () => {
    const { items } = calcCompleteness(makeUser(), [], [makeQA()])
    expect(items.find((i) => i.key === 'qa')!.done).toBe(true)
  })

  it('항목은 총 6개', () => {
    const { items } = calcCompleteness(makeUser(), [], [])
    expect(items).toHaveLength(6)
  })

  it('3/6 완료 시 50%', () => {
    // name+title(1) + bio(1) + photo(1) = 3개
    const user = makeUser({ name: '김', title: 'Dev', bio: '소개', photo_url: 'https://img' })
    const { percent } = calcCompleteness(user, [], [])
    expect(percent).toBe(50)
  })

  it('percent는 항상 0~100 사이', () => {
    const { percent } = calcCompleteness(makeUser(), [], [])
    expect(percent).toBeGreaterThanOrEqual(0)
    expect(percent).toBeLessThanOrEqual(100)
  })
})
