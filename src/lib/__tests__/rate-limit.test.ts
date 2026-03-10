import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter, getClientIp } from '@/lib/rate-limit'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({ limit: 3, windowMs: 60_000 })
  })

  // ── 기본 동작 ──────────────────────────────
  it('limit 이하 요청은 허용한다', () => {
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
  })

  it('limit 초과 요청은 거부한다', () => {
    limiter.check('ip1') // 1
    limiter.check('ip1') // 2
    limiter.check('ip1') // 3
    expect(limiter.check('ip1')).toBe(false) // 4 → 거부
  })

  it('정확히 limit번째 요청은 허용한다', () => {
    limiter.check('ip1') // 1
    limiter.check('ip1') // 2
    expect(limiter.check('ip1')).toBe(true) // 3 = limit → 허용
  })

  // ── 윈도우 초기화 ──────────────────────────
  it('windowMs 경과 후 카운터가 초기화된다', () => {
    const now = 1_000_000

    limiter.check('ip1', now)
    limiter.check('ip1', now)
    limiter.check('ip1', now)
    expect(limiter.check('ip1', now)).toBe(false) // 초과

    // 1분 뒤
    const later = now + 60_001
    expect(limiter.check('ip1', later)).toBe(true) // 초기화되어 허용
  })

  it('윈도우 경계 직전은 여전히 차단된다', () => {
    const now = 1_000_000
    limiter.check('ip1', now)
    limiter.check('ip1', now)
    limiter.check('ip1', now)

    const justBefore = now + 59_999 // 아직 윈도우 내
    expect(limiter.check('ip1', justBefore)).toBe(false)
  })

  // ── IP 격리 ────────────────────────────────
  it('다른 IP는 독립적으로 카운트된다', () => {
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.check('ip1')
    expect(limiter.check('ip1')).toBe(false) // ip1 초과

    expect(limiter.check('ip2')).toBe(true)  // ip2는 독립
  })

  // ── 카운트 조회 ────────────────────────────
  it('getCount가 현재 카운트를 반환한다', () => {
    expect(limiter.getCount('ip1')).toBe(0)
    limiter.check('ip1')
    limiter.check('ip1')
    expect(limiter.getCount('ip1')).toBe(2)
  })

  it('존재하지 않는 key의 getCount는 0을 반환한다', () => {
    expect(limiter.getCount('unknown')).toBe(0)
  })

  // ── 초기화 ────────────────────────────────
  it('reset(key)은 특정 IP만 초기화한다', () => {
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.check('ip2')

    limiter.reset('ip1')

    expect(limiter.getCount('ip1')).toBe(0)
    expect(limiter.getCount('ip2')).toBe(1) // ip2는 유지
  })

  it('reset()은 전체를 초기화한다', () => {
    limiter.check('ip1')
    limiter.check('ip2')
    limiter.check('ip3')

    limiter.reset()

    expect(limiter.getCount('ip1')).toBe(0)
    expect(limiter.getCount('ip2')).toBe(0)
    expect(limiter.getCount('ip3')).toBe(0)
  })

  // ── 윈도우 경계값 ──────────────────────────
  it('정확히 resetAt 시점에서는 초기화된다', () => {
    const now = 1_000_000
    limiter.check('ip1', now)
    limiter.check('ip1', now)
    limiter.check('ip1', now)

    // resetAt = now + 60_000, 정확히 그 시점
    expect(limiter.check('ip1', now + 60_000)).toBe(true)
  })
})

describe('getClientIp', () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request('http://localhost/api/chat', {
      method: 'POST',
      headers,
    })
  }

  it('x-forwarded-for 첫 번째 IP를 반환한다', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('x-forwarded-for 공백을 트림한다', () => {
    const req = makeRequest({ 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('x-forwarded-for가 없으면 x-real-ip를 반환한다', () => {
    const req = makeRequest({ 'x-real-ip': '9.10.11.12' })
    expect(getClientIp(req)).toBe('9.10.11.12')
  })

  it('헤더가 없으면 "unknown"을 반환한다', () => {
    const req = makeRequest({})
    expect(getClientIp(req)).toBe('unknown')
  })

  it('x-forwarded-for가 단일 IP일 때도 올바르게 반환한다', () => {
    const req = makeRequest({ 'x-forwarded-for': '192.168.1.1' })
    expect(getClientIp(req)).toBe('192.168.1.1')
  })
})
