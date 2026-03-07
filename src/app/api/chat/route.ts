import { apiFetch } from '@/lib/api-client'

export async function POST(req: Request) {
  const body = await req.text()

  const upstream = await apiFetch('/api/chat', {
    method: 'POST',
    body,
  })

  if (!upstream.ok) {
    const err = await upstream.text()
    return new Response(err, { status: upstream.status, headers: { 'Content-Type': 'application/json' } })
  }

  // FastAPI의 스트리밍 응답을 그대로 브라우저로 전달
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
