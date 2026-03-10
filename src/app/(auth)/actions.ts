'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_PERSONA_CONFIG } from '@/lib/constants'

// ─────────────────────────────────────────────
// 로그인
// ─────────────────────────────────────────────
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/dashboard'

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('이메일과 비밀번호를 입력해주세요.')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('이메일 또는 비밀번호가 올바르지 않습니다.')}`)
  }

  revalidatePath('/dashboard')
  redirect(next.startsWith('/') ? next : '/dashboard')
}

// ─────────────────────────────────────────────
// 회원가입
// ─────────────────────────────────────────────
export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password || !username) {
    redirect(`/signup?error=${encodeURIComponent('모든 항목을 입력해주세요.')}`)
  }

  if (!/^[a-z0-9-]+$/.test(username)) {
    redirect(`/signup?error=${encodeURIComponent('username은 영소문자, 숫자, 하이픈만 사용할 수 있습니다.')}`)
  }

  const supabaseAdmin = createAdminClient()

  // username 중복 확인 (maybeSingle: 없으면 null, .single()은 없을 때 에러)
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existingUser) {
    redirect(`/signup?error=${encodeURIComponent('이미 사용 중인 사용자 이름입니다.')}`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.user) {
    redirect(`/signup?error=${encodeURIComponent('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.')}`)
  }

  const { error: insertError } = await supabaseAdmin.from('users').insert({
    auth_id: data.user.id,
    username,
    name: '',
    title: '',
    bio: '',
    persona_config: DEFAULT_PERSONA_CONFIG,
  })

  if (insertError) {
    // 프로필 생성 실패 시 auth 유저도 정리
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    redirect(`/signup?error=${encodeURIComponent('프로필 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// ─────────────────────────────────────────────
// 로그아웃
// ─────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─────────────────────────────────────────────
// 비밀번호 재설정 이메일 발송
// ─────────────────────────────────────────────
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent('이메일을 입력해주세요.')}`)
  }

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // type=recovery → /auth/callback에서 /reset-password로 분기
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery&next=/reset-password`,
  })

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.')}`)
  }

  // 보안: 존재하지 않는 이메일도 동일한 성공 메시지 표시
  redirect('/forgot-password?sent=1')
}

// ─────────────────────────────────────────────
// 새 비밀번호 저장
// ─────────────────────────────────────────────
export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 6) {
    redirect(`/reset-password?error=${encodeURIComponent('비밀번호는 6자 이상이어야 합니다.')}`)
  }

  if (password !== confirm) {
    redirect(`/reset-password?error=${encodeURIComponent('비밀번호가 일치하지 않습니다.')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent('비밀번호 변경에 실패했습니다. 링크가 만료됐을 수 있습니다.')}`)
  }

  redirect('/login?message=' + encodeURIComponent('비밀번호가 변경됐습니다. 새 비밀번호로 로그인해주세요.'))
}
