import { describe, it, expect } from 'vitest'

/**
 * auth/actions.ts 의 검증 규칙을 독립 함수로 추출하여 테스트.
 * Server Actions는 직접 호출이 불가하므로, 동일한 로직을 순수 함수로 검증한다.
 */

// ── username 규칙 ─────────────────────────────────────────
const USERNAME_PATTERN = /^[a-z0-9-]+$/

function validateUsername(username: string): string | null {
  if (!username) return '모든 항목을 입력해주세요.'
  if (username.length < 3) return '3자 이상 입력해주세요'
  if (username.length > 30) return 'username은 30자 이하여야 합니다.'
  if (!USERNAME_PATTERN.test(username)) return 'username은 영소문자, 숫자, 하이픈만 사용할 수 있습니다.'
  return null // 유효
}

// ── 비밀번호 규칙 ─────────────────────────────────────────
function validateResetPassword(password: string, confirm: string): string | null {
  if (!password || password.length < 6) return '비밀번호는 6자 이상이어야 합니다.'
  if (password !== confirm) return '비밀번호가 일치하지 않습니다.'
  return null
}

// ── next 리다이렉트 경로 검증 ──────────────────────────────
function sanitizeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/')) return '/dashboard'
  return next
}

// ─────────────────────────────────────────────────────────

describe('username 검증', () => {
  it('유효한 username을 허용한다', () => {
    expect(validateUsername('minjun')).toBeNull()
    expect(validateUsername('min-jun')).toBeNull()
    expect(validateUsername('abc123')).toBeNull()
    expect(validateUsername('a-b-c')).toBeNull()
  })

  it('빈 값을 거부한다', () => {
    expect(validateUsername('')).not.toBeNull()
  })

  it('2자 이하를 거부한다', () => {
    expect(validateUsername('ab')).not.toBeNull()
  })

  it('3자는 허용한다', () => {
    expect(validateUsername('abc')).toBeNull()
  })

  it('31자 이상을 거부한다', () => {
    expect(validateUsername('a'.repeat(31))).not.toBeNull()
  })

  it('30자는 허용한다', () => {
    expect(validateUsername('a'.repeat(30))).toBeNull()
  })

  it('한글을 거부한다', () => {
    expect(validateUsername('홍길동')).not.toBeNull()
  })

  it('대문자를 거부한다', () => {
    expect(validateUsername('MinJun')).not.toBeNull()
  })

  it('공백을 거부한다', () => {
    expect(validateUsername('min jun')).not.toBeNull()
  })

  it('특수문자를 거부한다 (하이픈 제외)', () => {
    expect(validateUsername('min_jun')).not.toBeNull()
    expect(validateUsername('min.jun')).not.toBeNull()
    expect(validateUsername('min@jun')).not.toBeNull()
  })

  it('하이픈은 허용한다', () => {
    expect(validateUsername('min-jun')).toBeNull()
  })
})

describe('비밀번호 재설정 검증', () => {
  it('6자 이상 일치하는 비밀번호를 허용한다', () => {
    expect(validateResetPassword('password123', 'password123')).toBeNull()
  })

  it('5자 이하 비밀번호를 거부한다', () => {
    expect(validateResetPassword('abc12', 'abc12')).not.toBeNull()
    expect(validateResetPassword('12345', '12345')).not.toBeNull()
  })

  it('정확히 6자는 허용한다', () => {
    expect(validateResetPassword('abcdef', 'abcdef')).toBeNull()
  })

  it('불일치 비밀번호를 거부한다', () => {
    expect(validateResetPassword('password123', 'password456')).not.toBeNull()
  })

  it('빈 비밀번호를 거부한다', () => {
    expect(validateResetPassword('', '')).not.toBeNull()
  })

  it('대소문자 다른 비밀번호를 거부한다', () => {
    expect(validateResetPassword('Password', 'password')).not.toBeNull()
  })
})

describe('next 리다이렉트 경로 검증', () => {
  it('정상 경로를 그대로 반환한다', () => {
    expect(sanitizeNext('/dashboard')).toBe('/dashboard')
    expect(sanitizeNext('/dashboard/settings')).toBe('/dashboard/settings')
  })

  it('undefined → /dashboard 기본값 반환', () => {
    expect(sanitizeNext(undefined)).toBe('/dashboard')
  })

  it('빈 문자열 → /dashboard 기본값 반환', () => {
    expect(sanitizeNext('')).toBe('/dashboard')
  })

  it('외부 URL(/ 미시작)은 /dashboard로 폴백', () => {
    // 오픈 리다이렉트 방지
    expect(sanitizeNext('https://evil.com')).toBe('/dashboard')
    expect(sanitizeNext('evil.com/path')).toBe('/dashboard')
  })

  it('/ 시작 경로는 허용한다', () => {
    expect(sanitizeNext('/profile')).toBe('/profile')
  })
})

describe('auth 미들웨어 라우팅 규칙', () => {
  const PROTECTED_PREFIXES = ['/dashboard']
  const AUTH_PATHS = ['/login', '/signup', '/forgot-password']

  function shouldRedirectToLogin(pathname: string, isAuthenticated: boolean): boolean {
    return !isAuthenticated && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  }

  function shouldRedirectToDashboard(pathname: string, isAuthenticated: boolean): boolean {
    return isAuthenticated && AUTH_PATHS.includes(pathname)
  }

  it('미인증 상태로 /dashboard 접근 → 로그인 리다이렉트', () => {
    expect(shouldRedirectToLogin('/dashboard', false)).toBe(true)
  })

  it('인증 상태로 /dashboard 접근 → 통과', () => {
    expect(shouldRedirectToLogin('/dashboard', true)).toBe(false)
  })

  it('미인증 상태로 /login 접근 → 통과', () => {
    expect(shouldRedirectToLogin('/login', false)).toBe(false)
  })

  it('미인증 상태로 /[username] 접근 → 통과', () => {
    expect(shouldRedirectToLogin('/demo-user', false)).toBe(false)
  })

  it('인증 상태로 /login 접근 → 대시보드 리다이렉트', () => {
    expect(shouldRedirectToDashboard('/login', true)).toBe(true)
  })

  it('인증 상태로 /signup 접근 → 대시보드 리다이렉트', () => {
    expect(shouldRedirectToDashboard('/signup', true)).toBe(true)
  })

  it('인증 상태로 /forgot-password 접근 → 대시보드 리다이렉트', () => {
    expect(shouldRedirectToDashboard('/forgot-password', true)).toBe(true)
  })

  it('미인증 상태로 /login 접근 → 대시보드 리다이렉트 안 함', () => {
    expect(shouldRedirectToDashboard('/login', false)).toBe(false)
  })

  it('인증 상태로 / 접근 → 리다이렉트 안 함', () => {
    expect(shouldRedirectToDashboard('/', true)).toBe(false)
    expect(shouldRedirectToLogin('/', true)).toBe(false)
  })
})
