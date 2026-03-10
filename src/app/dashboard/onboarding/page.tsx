import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.getUser()
  if (error || !authData.user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('username, name')
    .eq('auth_id', authData.user.id)
    .single()

  if (!userData) redirect('/login?error=Profile+not+found')

  return <OnboardingClient username={userData.username} name={userData.name} />
}
