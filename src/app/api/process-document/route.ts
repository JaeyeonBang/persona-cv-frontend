import { apiFetch } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.text()

    const upstream = await apiFetch('/api/documents/process', {
      method: 'POST',
      body,
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (error) {
    console.error('[process-document] Failed to call backend:', error)
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 })
  }
}
