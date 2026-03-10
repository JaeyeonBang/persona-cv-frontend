/**
 * IP 기반 in-memory rate limiter.
 * 서버 재시작 시 카운터 초기화 (MVP 수준).
 */

export interface RateLimitOptions {
  /** 허용 요청 수 */
  limit: number
  /** 윈도우 크기 (ms) */
  windowMs: number
}

export interface RateEntry {
  count: number
  resetAt: number
}

export class RateLimiter {
  private readonly map = new Map<string, RateEntry>()
  private readonly limit: number
  private readonly windowMs: number

  constructor({ limit, windowMs }: RateLimitOptions) {
    this.limit = limit
    this.windowMs = windowMs
  }

  /**
   * @returns true = 허용, false = 초과
   */
  check(key: string, now = Date.now()): boolean {
    const entry = this.map.get(key)

    if (!entry || now >= entry.resetAt) {
      this.map.set(key, { count: 1, resetAt: now + this.windowMs })
      return true
    }

    if (entry.count >= this.limit) {
      return false
    }

    this.map.set(key, { ...entry, count: entry.count + 1 })
    return true
  }

  /** 테스트용: 상태 초기화 */
  reset(key?: string) {
    if (key) {
      this.map.delete(key)
    } else {
      this.map.clear()
    }
  }

  /** 현재 카운트 조회 (테스트용) */
  getCount(key: string): number {
    return this.map.get(key)?.count ?? 0
  }
}

/** Request에서 클라이언트 IP 추출 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
