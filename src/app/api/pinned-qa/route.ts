import { apiFetch } from '@/lib/api-client'

// GET /api/pinned-qa?username=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username') ?? ''

  const upstream = await apiFetch(`/api/pinned-qa?username=${encodeURIComponent(username)}`)
  const data = await upstream.json()
  return Response.json(data, { status: upstream.status })
}

// POST /api/pinned-qa  (create or generate)
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') // 'generate' | null

  const path = action === 'generate' ? '/api/pinned-qa/generate' : '/api/pinned-qa'
  const body = await req.text()

  const upstream = await apiFetch(path, { method: 'POST', body })
  const data = await upstream.json()
  return Response.json(data, { status: upstream.status })
}

// PUT /api/pinned-qa?id=xxx
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') ?? ''

  const body = await req.text()
  const upstream = await apiFetch(`/api/pinned-qa/${id}`, { method: 'PUT', body })
  const data = await upstream.json()
  return Response.json(data, { status: upstream.status })
}

// DELETE /api/pinned-qa?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') ?? ''

  const upstream = await apiFetch(`/api/pinned-qa/${id}`, { method: 'DELETE' })
  if (upstream.status === 204) {
    return new Response(null, { status: 204 })
  }
  const data = await upstream.json()
  return Response.json(data, { status: upstream.status })
}
