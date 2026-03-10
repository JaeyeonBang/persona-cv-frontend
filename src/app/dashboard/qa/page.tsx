import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User, PinnedQA } from '@/lib/types'
import { QAClient } from './qa-client'

export default async function QAPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authData.user.id)
    .single()

  if (!userData) redirect('/login?error=Profile+not+found')

  const { data: qaData } = await supabase
    .from('pinned_qa')
    .select('*')
    .eq('user_id', userData.id)
    .order('display_order')

  return (
    <QAClient
      user={userData as User}
      initialItems={(qaData ?? []) as PinnedQA[]}
    />
  )
}
