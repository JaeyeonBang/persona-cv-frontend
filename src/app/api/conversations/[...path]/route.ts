import { apiFetch } from '@/lib/api-client'

// POST /api/conversations/{id}/feedback → FastAPI 프록시
export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const upstream = await apiFetch(`/api/conversations/${path.join('/')}`, {
    method: 'POST',
    body: await req.text(),
  })
  const text = await upstream.text()
  return new Response(text || null, { status: upstream.status })
}
