import { z } from 'zod'

const envSchema = z.object({
  // Supabase (public)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Supabase (server-only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // OpenRouter (server-only) — LLM 채팅 + 임베딩
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('z-ai/glm-4.7-flash'),
  OPENROUTER_EMBEDDING_MODEL: z.string().default('openai/text-embedding-3-small'),

  // 사이트 공개 URL — 비밀번호 재설정 이메일의 callback URL 생성에 사용
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // FastAPI 백엔드
  FASTAPI_URL: z.string().url().default('http://localhost:8001'),

  // Graphiti
  GRAPHITI_API_URL: z.string().url().default('http://localhost:8000'),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables. Check .env.local.')
  }
  return result.data
}

export const env = validateEnv()
