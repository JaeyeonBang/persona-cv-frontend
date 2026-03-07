import { describe, it, expect } from 'vitest'

/**
 * DocumentSection의 스테이징 로직을 순수 함수로 추출해 검증합니다.
 */

type PendingUrl = {
  localId: string
  type: 'url' | 'github' | 'linkedin' | 'other'
  title: string
  source_url: string
}

type PendingPdf = {
  localId: string
  storagePath: string
  storageUrl: string
  title: string
}

function stagePdf(pending: PendingPdf[], item: Omit<PendingPdf, 'localId'>): PendingPdf[] {
  return [...pending, { ...item, localId: Math.random().toString(36).slice(2, 9) }]
}

function removePendingPdf(pending: PendingPdf[], localId: string): {
  next: PendingPdf[]
  removed: PendingPdf | undefined
} {
  return {
    next: pending.filter((p) => p.localId !== localId),
    removed: pending.find((p) => p.localId === localId),
  }
}

function validateStagingInput(title: string, url: string): string | null {
  if (!title.trim()) return '제목을 입력해주세요'
  if (!url.trim()) return 'URL을 입력해주세요'
  try {
    new URL(url)
    return null
  } catch {
    return '올바른 URL을 입력해주세요'
  }
}

function stageUrl(
  pending: PendingUrl[],
  item: Omit<PendingUrl, 'localId'>,
): PendingUrl[] {
  return [...pending, { ...item, localId: Math.random().toString(36).slice(2, 9) }]
}

function removePending(pending: PendingUrl[], localId: string): PendingUrl[] {
  return pending.filter((p) => p.localId !== localId)
}

describe('URL 스테이징 유효성 검사', () => {
  it('제목이 없으면 오류를 반환한다', () => {
    expect(validateStagingInput('', 'https://github.com')).toBe('제목을 입력해주세요')
  })

  it('URL이 없으면 오류를 반환한다', () => {
    expect(validateStagingInput('GitHub', '')).toBe('URL을 입력해주세요')
  })

  it('잘못된 URL 형식이면 오류를 반환한다', () => {
    expect(validateStagingInput('GitHub', 'not-a-url')).toBe('올바른 URL을 입력해주세요')
  })

  it('유효한 입력이면 null을 반환한다', () => {
    expect(validateStagingInput('GitHub', 'https://github.com/user')).toBeNull()
  })
})

describe('stageUrl', () => {
  it('빈 목록에 추가하면 1개가 된다', () => {
    const result = stageUrl([], { type: 'github', title: 'GitHub', source_url: 'https://github.com' })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('GitHub')
  })

  it('기존 목록을 변경하지 않는다 (immutable)', () => {
    const original: PendingUrl[] = [
      { localId: 'a', type: 'url', title: 'Test', source_url: 'https://test.com' },
    ]
    stageUrl(original, { type: 'github', title: 'GitHub', source_url: 'https://github.com' })
    expect(original).toHaveLength(1)
  })

  it('여러 개를 순서대로 추가한다', () => {
    let pending: PendingUrl[] = []
    pending = stageUrl(pending, { type: 'url', title: 'A', source_url: 'https://a.com' })
    pending = stageUrl(pending, { type: 'github', title: 'B', source_url: 'https://b.com' })
    expect(pending).toHaveLength(2)
    expect(pending[0].title).toBe('A')
    expect(pending[1].title).toBe('B')
  })
})

describe('removePending (URL)', () => {
  const items: PendingUrl[] = [
    { localId: 'id1', type: 'url', title: 'A', source_url: 'https://a.com' },
    { localId: 'id2', type: 'github', title: 'B', source_url: 'https://b.com' },
    { localId: 'id3', type: 'linkedin', title: 'C', source_url: 'https://c.com' },
  ]

  it('해당 localId만 제거한다', () => {
    const result = removePending(items, 'id2')
    expect(result).toHaveLength(2)
    expect(result.find((p) => p.localId === 'id2')).toBeUndefined()
  })

  it('없는 localId면 목록이 그대로다', () => {
    const result = removePending(items, 'nonexistent')
    expect(result).toHaveLength(3)
  })

  it('원본 배열을 변경하지 않는다 (immutable)', () => {
    removePending(items, 'id1')
    expect(items).toHaveLength(3)
  })
})

describe('stagePdf', () => {
  const item = { storagePath: 'pdfs/user/file.pdf', storageUrl: 'https://cdn.example.com/file.pdf', title: 'resume' }

  it('PDF를 pending 목록에 추가한다', () => {
    const result = stagePdf([], item)
    expect(result).toHaveLength(1)
    expect(result[0].storagePath).toBe(item.storagePath)
    expect(result[0].title).toBe('resume')
  })

  it('원본 배열을 변경하지 않는다 (immutable)', () => {
    const original: PendingPdf[] = [{ localId: 'x', ...item }]
    stagePdf(original, { ...item, title: 'other' })
    expect(original).toHaveLength(1)
  })
})

describe('removePendingPdf', () => {
  const items: PendingPdf[] = [
    { localId: 'p1', storagePath: 'pdfs/user/a.pdf', storageUrl: 'https://cdn.example.com/a.pdf', title: 'A' },
    { localId: 'p2', storagePath: 'pdfs/user/b.pdf', storageUrl: 'https://cdn.example.com/b.pdf', title: 'B' },
  ]

  it('해당 localId를 제거하고 removed를 반환한다', () => {
    const { next, removed } = removePendingPdf(items, 'p1')
    expect(next).toHaveLength(1)
    expect(removed?.storagePath).toBe('pdfs/user/a.pdf')
  })

  it('없는 localId면 removed가 undefined다', () => {
    const { next, removed } = removePendingPdf(items, 'none')
    expect(next).toHaveLength(2)
    expect(removed).toBeUndefined()
  })

  it('원본 배열을 변경하지 않는다 (immutable)', () => {
    removePendingPdf(items, 'p1')
    expect(items).toHaveLength(2)
  })
})
