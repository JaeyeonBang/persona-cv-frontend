import { redirect } from 'next/navigation'

// /demo → /demo 페르소나 페이지로 리다이렉트
export default function DemoPage() {
  redirect('/demo-user')
}
