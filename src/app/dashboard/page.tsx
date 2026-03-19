import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { ProfileSection } from '@/components/dashboard/profile-section'
import { DocumentSection } from '@/components/dashboard/document-section'
import { PersonaSection } from '@/components/dashboard/persona-section'
import { SuggestedQuestionsSection } from '@/components/dashboard/suggested-questions-section'
import { HistorySection } from '@/components/dashboard/history-section'
import { QAClient } from '@/app/dashboard/qa/qa-client'
import { QRShareSection } from '@/components/dashboard/qr-share-section'
import { ProfileCompletenessCard } from '@/components/dashboard/profile-completeness-card'
import { ThemeSection } from '@/components/dashboard/theme-section'
import type { User, Document, PinnedQA } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const activeTab = tab === 'history' ? 'history' : tab === 'qa' ? 'qa' : 'settings'

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

  const { data: qaData } = await supabase
    .from('pinned_qa')
    .select('*')
    .eq('user_id', user.id)
    .order('display_order')

  const qaItems = (qaData ?? []) as PinnedQA[]

  // 최초 프로필 설정 완료 후 Q&A 탭으로 안내
  const isFirstProfile = !user.name || user.name.trim() === ''

  const tabClass = (t: string) =>
    `border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
      activeTab === t
        ? 'border-zinc-800 text-zinc-800'
        : 'border-transparent text-zinc-400 hover:text-zinc-600'
    }`

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

      {/* Tab nav — 설정 / 예상 Q&A / 대화 히스토리 */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-5xl gap-1 px-4 md:px-6">
          <Link href="/dashboard" className={tabClass('settings')}>설정</Link>
          <Link href="/dashboard?tab=qa" className={tabClass('qa')}>예상 Q&A</Link>
          <Link href="/dashboard?tab=history" className={tabClass('history')}>대화 히스토리</Link>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        {activeTab === 'settings' && (
          <>
            <ProfileCompletenessCard user={user} docs={docs} qaItems={qaItems} />
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
              {/* Row 1, Col 1 */}
              <ProfileSection user={user} showOnboardingRedirect={isFirstProfile} />

              {/* Row 1, Col 2 */}
              <PersonaSection user={user} />

              {/* Row 2, Col 1 — h-full fills remaining row height */}
              <div className="min-h-[320px] [&>section]:h-full">
                <DocumentSection userId={user.id} initialDocuments={docs} />
              </div>

              {/* Row 2, Col 2 */}
              <div className="min-h-[320px] [&>section]:h-full">
                <SuggestedQuestionsSection user={user} />
              </div>
            </div>

            {/* QR 공유 + 테마 */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <QRShareSection username={user.username} />
              <ThemeSection userId={user.id} currentTheme={user.theme ?? 'default'} />
            </div>

            {/* 설정 완료 → 예상 Q&A로 */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard?tab=qa"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-zinc-900 px-8 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-700 hover:shadow-xl"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                설정 완료 — 예상 Q&A 설정하기
              </Link>
            </div>
          </>
        )}

        {activeTab === 'qa' && (
          <QAClient user={user} initialItems={qaItems} portfolio={docs} />
        )}

        {activeTab === 'history' && (
          <HistorySection userId={user.id} username={user.username} />
        )}
      </main>
    </div>
  )
}
