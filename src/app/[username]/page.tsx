import { createAdminClient } from '@/lib/supabase/admin'
import { VisitorPage } from '@/components/persona/visitor-page'
import { userToPersona } from '@/lib/user-to-persona'
import type { User } from '@/lib/types'

interface Props {
  params: Promise<{ username: string }>
}

export default async function PersonaPage({ params }: Props) {
  const { username } = await params

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-zinc-800">존재하지 않는 명함입니다.</p>
          <p className="mt-1 text-sm text-zinc-400">@{username}</p>
        </div>
      </main>
    )
  }

  return <VisitorPage persona={userToPersona(user as User)} />
}
