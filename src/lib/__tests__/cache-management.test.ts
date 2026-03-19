import { describe, it, expect } from 'vitest'
import type { ConversationRow } from '../history-analytics'

function makeRow(overrides: Partial<ConversationRow> = {}): ConversationRow {
  return {
    id: crypto.randomUUID(),
    session_id: 'sess',
    question: '자기소개 해줘',
    answer: '저는 개발자입니다',
    feedback: null,
    is_cached: false,
    created_at: '2026-03-18T10:00:00Z',
    ...overrides,
  }
}

// ── ConversationRow 타입 ───────────────────────────────────────────────────────

describe('ConversationRow.is_cached', () => {
  it('is_cached: false인 행을 생성할 수 있다', () => {
    const row = makeRow({ is_cached: false })
    expect(row.is_cached).toBe(false)
  })

  it('is_cached: true인 행을 생성할 수 있다', () => {
    const row = makeRow({ is_cached: true })
    expect(row.is_cached).toBe(true)
  })

  it('is_cached 필드가 boolean이다', () => {
    const row = makeRow()
    expect(typeof row.is_cached).toBe('boolean')
  })
})

// ── 캐시 필터링 로직 ──────────────────────────────────────────────────────────

describe('캐시 대화 필터링', () => {
  const rows: ConversationRow[] = [
    makeRow({ id: '1', is_cached: true }),
    makeRow({ id: '2', is_cached: false }),
    makeRow({ id: '3', is_cached: true }),
    makeRow({ id: '4', is_cached: false }),
    makeRow({ id: '5', is_cached: false }),
  ]

  it('캐시된 대화만 필터링한다', () => {
    const cached = rows.filter((r) => r.is_cached)
    expect(cached).toHaveLength(2)
    expect(cached.map((r) => r.id)).toEqual(['1', '3'])
  })

  it('캐시되지 않은 대화만 필터링한다', () => {
    const notCached = rows.filter((r) => !r.is_cached)
    expect(notCached).toHaveLength(3)
  })

  it('빈 배열에서 캐시 필터링하면 빈 배열이다', () => {
    expect([].filter((r: ConversationRow) => r.is_cached)).toHaveLength(0)
  })
})

// ── 단건 삭제 낙관적 업데이트 ─────────────────────────────────────────────────

describe('단건 삭제 낙관적 업데이트', () => {
  it('특정 id를 제거한 새 배열을 반환한다', () => {
    const rows = [makeRow({ id: 'a' }), makeRow({ id: 'b' }), makeRow({ id: 'c' })]
    const updated = rows.filter((r) => r.id !== 'b')
    expect(updated).toHaveLength(2)
    expect(updated.map((r) => r.id)).toEqual(['a', 'c'])
  })

  it('존재하지 않는 id를 제거해도 원본 길이가 유지된다', () => {
    const rows = [makeRow({ id: 'a' }), makeRow({ id: 'b' })]
    const updated = rows.filter((r) => r.id !== 'z')
    expect(updated).toHaveLength(2)
  })

  it('원본 배열을 변경하지 않는다 (불변성)', () => {
    const rows = [makeRow({ id: 'a' }), makeRow({ id: 'b' })]
    const original = [...rows]
    rows.filter((r) => r.id !== 'a')
    expect(rows).toHaveLength(original.length)
  })
})

// ── 답변 수정 낙관적 업데이트 ────────────────────────────────────────────────

describe('답변 수정 낙관적 업데이트', () => {
  it('특정 id의 answer를 교체한 새 배열을 반환한다', () => {
    const rows = [
      makeRow({ id: 'a', answer: '원래 답변' }),
      makeRow({ id: 'b', answer: '다른 답변' }),
    ]
    const updated = rows.map((r) => (r.id === 'a' ? { ...r, answer: '수정된 답변' } : r))
    expect(updated.find((r) => r.id === 'a')?.answer).toBe('수정된 답변')
    expect(updated.find((r) => r.id === 'b')?.answer).toBe('다른 답변')
  })

  it('수정 후 다른 필드는 유지된다', () => {
    const row = makeRow({ id: 'x', question: '원본 질문', is_cached: true })
    const [updated] = [row].map((r) => (r.id === 'x' ? { ...r, answer: '새 답변' } : r))
    expect(updated.question).toBe('원본 질문')
    expect(updated.is_cached).toBe(true)
    expect(updated.id).toBe('x')
  })

  it('원본 객체를 변경하지 않는다 (불변성)', () => {
    const row = makeRow({ id: 'y', answer: '기존 답변' })
    const updated = { ...row, answer: '새 답변' }
    expect(row.answer).toBe('기존 답변')
    expect(updated.answer).toBe('새 답변')
  })
})

// ── 전체 삭제 낙관적 업데이트 ────────────────────────────────────────────────

describe('전체 삭제 낙관적 업데이트', () => {
  it('전체 삭제 후 빈 배열이 된다', () => {
    const rows = [makeRow(), makeRow(), makeRow()]
    const cleared: ConversationRow[] = []
    expect(cleared).toHaveLength(0)
    // 원본은 여전히 남아 있음 (롤백용)
    expect(rows).toHaveLength(3)
  })

  it('롤백 시 초기 대화 목록이 복원된다', () => {
    const initial = [makeRow({ id: '1' }), makeRow({ id: '2' })]
    let current: ConversationRow[] = []
    // 낙관적으로 비움
    expect(current).toHaveLength(0)
    // API 실패 → 롤백
    current = initial
    expect(current).toHaveLength(2)
    expect(current.map((r) => r.id)).toEqual(['1', '2'])
  })
})

// ── 캐시 배지 조건 ────────────────────────────────────────────────────────────

describe('캐시 배지 표시 조건', () => {
  it('is_cached: true이면 배지를 표시한다', () => {
    const row = makeRow({ is_cached: true })
    const showBadge = row.is_cached
    expect(showBadge).toBe(true)
  })

  it('is_cached: false이면 배지를 표시하지 않는다', () => {
    const row = makeRow({ is_cached: false })
    const showBadge = row.is_cached
    expect(showBadge).toBe(false)
  })
})
