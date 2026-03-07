import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureDemoUser } from './actions'
import { DEMO_USERNAME } from '@/lib/constants'
import { ProfileSection } from '@/components/dashboard/profile-section'
import { DocumentSection } from '@/components/dashboard/document-section'
import { PersonaSection } from '@/components/dashboard/persona-section'
import { SuggestedQuestionsSection } from '@/components/dashboard/suggested-questions-section'
import type { User, Document } from '@/lib/types'

export default async function DashboardPage() {
  const user = (await ensureDemoUser()) as User

  const supabase = createAdminClient()
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
          <Link
            href={`/${DEMO_USERNAME}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            방문자로 보기
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
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
      </main>
    </div>
  )
}
