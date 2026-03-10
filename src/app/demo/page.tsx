import { redirect } from 'next/navigation'
import { DEMO_USERNAME } from '@/lib/constants'

export default function DemoPage() {
  redirect(`/${DEMO_USERNAME}`)
}
