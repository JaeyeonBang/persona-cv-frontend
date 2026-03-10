import { apiFetch } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const upstream = await apiFetch(`/api/documents/${id}/progress`)
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
