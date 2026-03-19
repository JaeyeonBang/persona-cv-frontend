import { apiFetch } from '@/lib/api-client'

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const upstream = await apiFetch(`/api/conversations/${path.join('/')}`, {
    method: 'POST',
    body: await req.text(),
  })
  const text = await upstream.text()
  return new Response(text || null, { status: upstream.status })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const upstream = await apiFetch(`/api/conversations/${path.join('/')}`, { method: 'DELETE' })
  return new Response(null, { status: upstream.status })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const upstream = await apiFetch(`/api/conversations/${path.join('/')}`, {
    method: 'PATCH',
    body: await req.text(),
  })
  const text = await upstream.text()
  return new Response(text || null, { status: upstream.status })
}
