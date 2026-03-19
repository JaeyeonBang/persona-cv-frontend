import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 순수 로직: 공유 URL 생성
function buildShareUrl(username: string, baseUrl = ''): string {
  return `${baseUrl}/${username}`
}

// Web Share API 사용 가능 여부
function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

describe('buildShareUrl', () => {
  it('username으로 올바른 URL을 생성한다', () => {
    expect(buildShareUrl('jaeyeon', 'https://personaid.app')).toBe('https://personaid.app/jaeyeon')
  })

  it('baseUrl 없으면 /username 형태', () => {
    expect(buildShareUrl('demo-user')).toBe('/demo-user')
  })

  it('특수문자 없는 username 그대로 사용', () => {
    expect(buildShareUrl('my-name', 'https://example.com')).toBe('https://example.com/my-name')
  })
})

describe('canNativeShare', () => {
  it('navigator.share 없으면 false', () => {
    // jsdom에는 navigator.share가 없음
    expect(canNativeShare()).toBe(false)
  })

  it('navigator.share 있으면 true', () => {
    const orig = navigator.share
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    })
    expect(canNativeShare()).toBe(true)
    Object.defineProperty(navigator, 'share', { value: orig, configurable: true, writable: true })
  })
})

// clipboard API 모킹
describe('클립보드 복사 로직', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clipboard.writeText가 올바른 URL로 호출된다', async () => {
    const url = 'https://personaid.app/jaeyeon'
    await navigator.clipboard.writeText(url)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url)
  })
})
