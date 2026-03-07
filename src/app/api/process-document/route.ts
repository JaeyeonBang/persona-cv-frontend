import { apiFetch } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.text()

  const upstream = await apiFetch('/api/documents/process', {
    method: 'POST',
    body,
  })

  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
