import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Message } from '@/components/persona/chat-bubble'

// ── Message 타입 검증 ────────────────────────────────────────────────────────

describe('Message 타입 — 피드백 필드', () => {
  it('assistantMsg에 conversationId 필드를 포함할 수 있다', () => {
    const msg: Message = {
      id: 'msg-1',
      role: 'assistant',
      content: '안녕하세요',
      conversationId: 'conv-abc-123',
    }
    expect(msg.conversationId).toBe('conv-abc-123')
  })

  it('assistantMsg에 feedback 1/-1/null을 포함할 수 있다', () => {
    const positive: Message = { id: '1', role: 'assistant', content: '답변', feedback: 1 }
    const negative: Message = { id: '2', role: 'assistant', content: '답변', feedback: -1 }
    const none: Message = { id: '3', role: 'assistant', content: '답변', feedback: null }

    expect(positive.feedback).toBe(1)
    expect(negative.feedback).toBe(-1)
    expect(none.feedback).toBeNull()
  })

  it('피드백 없이도 Message를 생성할 수 있다 (optional)', () => {
    const msg: Message = { id: '1', role: 'user', content: '질문' }
    expect(msg.conversationId).toBeUndefined()
    expect(msg.feedback).toBeUndefined()
  })

  it('role이 user인 메시지는 conversationId 없어도 된다', () => {
    const msg: Message = { id: '1', role: 'user', content: '질문입니다' }
    expect(msg.role).toBe('user')
    expect(msg.conversationId).toBeUndefined()
  })
})

// ── SSE conversation_id 파싱 로직 검증 ──────────────────────────────────────

describe('SSE conversation_id 파싱', () => {
  function parseSseEvent(raw: string): Record<string, unknown> | null {
    const line = raw.trim()
    if (!line.startsWith('data: ')) return null
    const data = line.slice(6)
    if (data === '[DONE]') return null
    try { return JSON.parse(data) } catch { return null }
  }

  it('conversation_id 이벤트를 올바르게 파싱한다', () => {
    const raw = 'data: {"type":"conversation_id","id":"uuid-test-123"}'
    const parsed = parseSseEvent(raw)
    expect(parsed?.type).toBe('conversation_id')
    expect(parsed?.id).toBe('uuid-test-123')
  })

  it('[DONE]은 null을 반환한다', () => {
    expect(parseSseEvent('data: [DONE]')).toBeNull()
  })

  it('빈 데이터는 null을 반환한다', () => {
    expect(parseSseEvent('')).toBeNull()
    expect(parseSseEvent('   ')).toBeNull()
  })

  it('data: 접두어 없는 라인은 null을 반환한다', () => {
    expect(parseSseEvent('{"type":"text","content":"안녕"}')).toBeNull()
  })

  it('text 이벤트를 올바르게 파싱한다', () => {
    const raw = 'data: {"type":"text","content":"안녕하세요"}'
    const parsed = parseSseEvent(raw)
    expect(parsed?.type).toBe('text')
    expect(parsed?.content).toBe('안녕하세요')
  })

  it('cache_hit 이벤트를 올바르게 파싱한다', () => {
    const raw = 'data: {"type":"cache_hit"}'
    const parsed = parseSseEvent(raw)
    expect(parsed?.type).toBe('cache_hit')
  })

  it('graph_fallback 이벤트를 올바르게 파싱한다', () => {
    const raw = 'data: {"type":"graph_fallback","used":true}'
    const parsed = parseSseEvent(raw)
    expect(parsed?.type).toBe('graph_fallback')
    expect(parsed?.used).toBe(true)
  })

  it('깨진 JSON은 null을 반환한다', () => {
    const raw = 'data: {broken json'
    expect(parseSseEvent(raw)).toBeNull()
  })
})

// ── 피드백 API 호출 로직 검증 ────────────────────────────────────────────────

describe('피드백 fetch 로직', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('올바른 엔드포인트와 바디로 POST를 호출한다', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }))

    const conversationId = 'conv-abc-123'
    const feedback = 1

    await fetch(`/api/conversations/${conversationId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/conversations/conv-abc-123/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ feedback: 1 }),
      }),
    )
  })

  it('부정 피드백도 올바르게 전송된다', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await fetch('/api/conversations/conv-xyz/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: -1 }),
    })

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse((options as RequestInit).body as string)
    expect(body.feedback).toBe(-1)
  })
})
