import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const base =
        process.env.NODE_ENV === 'development' || !forwardedHost
          ? origin
          : `https://${forwardedHost}`

      // 비밀번호 재설정 콜백(type=recovery) → /reset-password
      // 일반 이메일 인증 → next (기본 /dashboard)
      const redirectPath = type === 'recovery' ? '/reset-password' : next
      return NextResponse.redirect(`${base}${redirectPath}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('유효하지 않은 링크입니다. 다시 시도해주세요.')}`,
  )
}
