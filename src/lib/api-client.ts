import { env } from '@/lib/env'

/**
 * FastAPI 백엔드에 요청을 보내는 클라이언트.
 * Next.js API routes는 이 함수를 통해 FastAPI로 프록시합니다.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${env.FASTAPI_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  return res
}
