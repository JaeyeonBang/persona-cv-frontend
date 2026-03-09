import { apiFetch } from '@/lib/api-client'
import { RateLimiter, getClientIp } from '@/lib/rate-limit'

// Vercel: 스트리밍 응답 시간 허용 (Pro: 300s, Hobby: 60s)
export const maxDuration = 60

const rateLimiter = new RateLimiter({ limit: 20, windowMs: 60_000 })

// ─────────────────────────────────────────────
// POST /api/chat — FastAPI 프록시
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  const ip = getClientIp(req)

  if (!rateLimiter.check(ip)) {
    return new Response(
      JSON.stringify({ detail: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      },
    )
  }

  const body = await req.text()

  const upstream = await apiFetch('/api/chat', {
    method: 'POST',
    body,
  })

  if (!upstream.ok) {
    const err = await upstream.text()
    return new Response(err, { status: upstream.status, headers: { 'Content-Type': 'application/json' } })
  }

  // FastAPI의 SSE 스트리밍 응답을 그대로 브라우저로 전달
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    },
  })
}
