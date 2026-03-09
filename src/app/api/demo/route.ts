import { ensureDemoUser } from '@/app/dashboard/actions'
import { NextResponse } from 'next/server'

/** GET /api/demo — demo-user가 없으면 생성 후 반환 (테스트·랜딩용) */
export async function GET() {
  try {
    const user = await ensureDemoUser()
    return NextResponse.json({ username: user.username })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
