import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { ProfileSection } from '@/components/dashboard/profile-section'
import { DocumentSection } from '@/components/dashboard/document-section'
import { PersonaSection } from '@/components/dashboard/persona-section'
import { SuggestedQuestionsSection } from '@/components/dashboard/suggested-questions-section'
import { HistorySection } from '@/components/dashboard/history-section'
import type { User, Document } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const activeTab = tab === 'history' ? 'history' : 'settings'

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    redirect('/login')
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authData.user.id)
    .single()

  if (userError || !userData) {
    redirect('/login?error=Profile+not+found')
  }

  const user = userData as User

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const docs = (documents ?? []) as Document[]

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="text-base font-bold text-zinc-800">내 명함 관리</h1>
            <p className="text-xs text-zinc-400">personaid.app/{user.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${user.username}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              방문자로 보기
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-5xl gap-1 px-4 md:px-6">
          <Link
            href="/dashboard"
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'settings'
              ? 'border-zinc-800 text-zinc-800'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
          >
            설정
          </Link>
          <Link
            href="/dashboard?tab=history"
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'history'
              ? 'border-zinc-800 text-zinc-800'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
          >
            대화 히스토리
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        {activeTab === 'settings' ? (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left column */}
              <div className="flex flex-col gap-6">
                <ProfileSection user={user} />
                <DocumentSection userId={user.id} initialDocuments={docs} />
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-6">
                <PersonaSection user={user} />
                <SuggestedQuestionsSection user={user} />
              </div>
            </div>

            {/* 설정 완료 버튼 */}
            <div className="mt-8 flex justify-center">
              <Link
                href={`/${user.username}`}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-zinc-900 px-8 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-700 hover:shadow-xl"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                설정 완료 — 채팅 시작하기
              </Link>
            </div>
          </>
        ) : (
          <HistorySection userId={user.id} />
        )}
      </main>
    </div>
  )
}
