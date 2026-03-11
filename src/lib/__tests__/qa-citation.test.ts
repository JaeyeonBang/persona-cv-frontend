import { describe, it, expect } from 'vitest'
import { insertCitationAtCursor, formatCitation, filterCitableDocs } from '../qa-citation'
import type { Document } from '../types'

const makeDoc = (overrides: Partial<Document> = {}): Document => ({
  id: 'doc-1',
  user_id: 'user-1',
  type: 'pdf',
  title: '이력서_2024.pdf',
  source_url: null,
  content: '',
  status: 'done',
  error_message: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('formatCitation', () => {
  it('일반 제목을 인용 포맷으로 변환한다', () => {
    expect(formatCitation(makeDoc({ title: '포트폴리오' }))).toBe('[출처: 포트폴리오]')
  })

  it('특수문자가 포함된 제목도 그대로 포함한다', () => {
    expect(formatCitation(makeDoc({ title: 'GitHub: my-project/repo' }))).toBe('[출처: GitHub: my-project/repo]')
  })

  it('빈 제목도 처리한다', () => {
    expect(formatCitation(makeDoc({ title: '' }))).toBe('[출처: ]')
  })
})

describe('insertCitationAtCursor', () => {
  const doc = makeDoc({ title: '이력서' })
  const citation = '[출처: 이력서]'

  it('커서가 끝에 있으면 텍스트 마지막에 삽입한다', () => {
    const { next, newCursorPos } = insertCitationAtCursor('안녕하세요', 5, doc)
    expect(next).toBe('안녕하세요[출처: 이력서]')
    expect(newCursorPos).toBe(5 + citation.length)
  })

  it('커서가 처음에 있으면 텍스트 앞에 삽입한다', () => {
    const { next } = insertCitationAtCursor('안녕하세요', 0, doc)
    expect(next).toBe('[출처: 이력서]안녕하세요')
  })

  it('커서가 중간에 있으면 해당 위치에 삽입한다', () => {
    const { next } = insertCitationAtCursor('안녕하세요', 2, doc)
    expect(next).toBe('안녕[출처: 이력서]하세요')
  })

  it('빈 텍스트에 삽입하면 인용만 반환한다', () => {
    const { next } = insertCitationAtCursor('', 0, doc)
    expect(next).toBe('[출처: 이력서]')
  })

  it('커서 위치가 음수면 0으로 처리한다', () => {
    const { next } = insertCitationAtCursor('텍스트', -5, doc)
    expect(next).toBe('[출처: 이력서]텍스트')
  })

  it('커서 위치가 길이를 초과하면 끝에 삽입한다', () => {
    const { next } = insertCitationAtCursor('텍스트', 999, doc)
    expect(next).toBe('텍스트[출처: 이력서]')
  })

  it('원본 문자열을 변경하지 않는다 (불변성)', () => {
    const original = '원본 텍스트'
    insertCitationAtCursor(original, 3, doc)
    expect(original).toBe('원본 텍스트')
  })
})

describe('filterCitableDocs', () => {
  it('done 상태 문서만 반환한다', () => {
    const docs: Document[] = [
      makeDoc({ id: '1', status: 'done' }),
      makeDoc({ id: '2', status: 'pending' }),
      makeDoc({ id: '3', status: 'processing' }),
      makeDoc({ id: '4', status: 'error' }),
      makeDoc({ id: '5', status: 'done' }),
    ]
    const result = filterCitableDocs(docs)
    expect(result).toHaveLength(2)
    expect(result.map((d) => d.id)).toEqual(['1', '5'])
  })

  it('빈 배열을 입력하면 빈 배열을 반환한다', () => {
    expect(filterCitableDocs([])).toEqual([])
  })

  it('모든 문서가 done이면 전체 반환한다', () => {
    const docs = [makeDoc({ id: '1' }), makeDoc({ id: '2' })]
    expect(filterCitableDocs(docs)).toHaveLength(2)
  })
})
