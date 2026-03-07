import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: {
    OPENROUTER_API_KEY: 'test-key',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    OPENROUTER_MODEL: 'z-ai/glm-4.7-flash',
    OPENROUTER_EMBEDDING_MODEL: 'openai/text-embedding-3-small',
    FASTAPI_URL: 'http://localhost:8001',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

import { buildSystemPrompt, parseOpenRouterStream } from '@/lib/llm'
import type { User } from '@/lib/types'
import type { InterviewerConfig } from '@/lib/types'

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  username: 'tester',
  name: '홍길동',
  title: '시니어 개발자',
  bio: '10년차 풀스택',
  photo_url: null,
  suggested_questions: [],
  persona_config: {
    preset: 'professional',
    custom_prompt: null,
    default_interviewer: {
      answer_length: 'medium',
      language: 'ko',
      speech_style: 'formal',
      question_style: 'free',
      show_citation: true,
    },
  },
  created_at: '',
  ...overrides,
})

const makeConfig = (overrides: Partial<InterviewerConfig> = {}): InterviewerConfig => ({
  answerLength: 'medium',
  language: 'ko',
  speechStyle: 'formal',
  questionStyle: 'free',
  showCitation: true,
  ...overrides,
})

describe('buildSystemPrompt', () => {
  it('유저 이름, 직책, bio 포함', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig(), '')
    expect(prompt).toContain('홍길동')
    expect(prompt).toContain('시니어 개발자')
    expect(prompt).toContain('10년차 풀스택')
  })

  it('컨텍스트 있을 때 참고 자료 섹션 포함', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig(), '관련 문서 내용')
    expect(prompt).toContain('참고 자료 (관련 문서에서 발췌)')
    expect(prompt).toContain('관련 문서 내용')
  })

  it('컨텍스트 없을 때 fallback 메시지', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig(), '')
    expect(prompt).toContain('등록된 문서가 없습니다')
  })

  it('한국어 설정 반영', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig({ language: 'ko' }), '')
    expect(prompt).toContain('한국어')
  })

  it('영어 설정 반영', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig({ language: 'en' }), '')
    expect(prompt).toContain('English')
  })

  it('격식체 설정 반영', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig({ speechStyle: 'formal' }), '')
    expect(prompt).toContain('합니다/입니다')
  })

  it('반말 설정 반영', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig({ speechStyle: 'casual' }), '')
    expect(prompt).toContain('반말')
  })

  it('custom_prompt 있을 때 포함', () => {
    const user = makeUser()
    user.persona_config.custom_prompt = '항상 유머를 섞어서 답변'
    const prompt = buildSystemPrompt(user, makeConfig(), '')
    expect(prompt).toContain('항상 유머를 섞어서 답변')
  })

  it('custom_prompt null일 때 추가 지시 라인 없음', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig(), '')
    expect(prompt).not.toContain('추가 지시')
  })

  it('1인칭 답변 지시사항 포함', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig(), '')
    expect(prompt).toContain('1인칭으로 답변')
  })

  it('마크다운 금지 지시사항 포함', () => {
    const prompt = buildSystemPrompt(makeUser(), makeConfig(), '')
    expect(prompt).toContain('마크다운 문법은 사용하지 마세요')
  })
})

// SSE 스트림 파싱 헬퍼
function makeStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + '\n'))
      }
      controller.close()
    },
  })
}

async function collectStream(stream: ReadableStream<string>): Promise<string[]> {
  const reader = stream.getReader()
  const chunks: string[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return chunks
}

describe('parseOpenRouterStream', () => {
  it('정상 SSE 청크에서 텍스트 추출', async () => {
    const raw = makeStream([
      'data: {"choices":[{"delta":{"content":"안녕"}}]}',
      'data: {"choices":[{"delta":{"content":"하세요"}}]}',
    ])
    const result = await collectStream(parseOpenRouterStream(raw))
    expect(result).toEqual(['안녕', '하세요'])
  })

  it('[DONE] 라인 스킵', async () => {
    const raw = makeStream([
      'data: {"choices":[{"delta":{"content":"hello"}}]}',
      'data: [DONE]',
    ])
    const result = await collectStream(parseOpenRouterStream(raw))
    expect(result).toEqual(['hello'])
  })

  it('data: 없는 라인 스킵', async () => {
    const raw = makeStream([
      'event: ping',
      'data: {"choices":[{"delta":{"content":"ok"}}]}',
    ])
    const result = await collectStream(parseOpenRouterStream(raw))
    expect(result).toEqual(['ok'])
  })

  it('잘못된 JSON 조용히 스킵', async () => {
    const raw = makeStream([
      'data: {invalid json}',
      'data: {"choices":[{"delta":{"content":"good"}}]}',
    ])
    const result = await collectStream(parseOpenRouterStream(raw))
    expect(result).toEqual(['good'])
  })

  it('content null/undefined인 청크 스킵', async () => {
    const raw = makeStream([
      'data: {"choices":[{"delta":{}}]}',
      'data: {"choices":[{"delta":{"content":"real"}}]}',
    ])
    const result = await collectStream(parseOpenRouterStream(raw))
    expect(result).toEqual(['real'])
  })

  it('빈 스트림은 빈 배열', async () => {
    const raw = makeStream([])
    const result = await collectStream(parseOpenRouterStream(raw))
    expect(result).toEqual([])
  })
})
