import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// Owner 전용 경로 — 미인증 시 /login 리다이렉트
const PROTECTED_PREFIXES = ['/dashboard']

// Auth 페이지 — 이미 로그인된 사용자는 /dashboard 리다이렉트
const AUTH_PATHS = ['/login', '/signup', '/forgot-password']

// Next.js 16.1+: proxy.ts 파일에서는 export 함수명도 proxy여야 함
export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createMiddlewareClient(request)

  // 세션 갱신 (getUser는 서버에서 토큰을 검증하므로 getSession보다 안전)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 미인증 → /dashboard 접근 차단
  if (!user && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 인증됨 → /login, /signup, /forgot-password 접근 시 /dashboard로 이동
  if (user && AUTH_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // 세션 쿠키 갱신 결과를 응답에 실어 반환
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 아래 경로는 매칭에서 제외:
     * - _next/static, _next/image (정적 파일)
     * - favicon.ico
     * - 공개 API 경로 (api/chat 등 — 별도 rate limiting으로 보호)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
