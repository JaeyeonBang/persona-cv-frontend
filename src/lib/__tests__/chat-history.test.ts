import { describe, it, expect } from 'vitest'

// visitor-page.tsx에서 히스토리를 구성하는 로직과 동일
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  citations?: unknown[]
}

function buildHistory(messages: Message[], limit = 10) {
  return messages
    .filter((m) => !m.isStreaming && m.content)
    .slice(-limit)
    .map((m) => ({ role: m.role, content: m.content }))
}

describe('buildHistory (대화 히스토리 구성)', () => {
  it('완료된 메시지만 포함한다', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: '안녕' },
      { id: '2', role: 'assistant', content: '안녕하세요', isStreaming: false },
      { id: '3', role: 'assistant', content: '', isStreaming: true }, // 스트리밍 중
    ]
    const history = buildHistory(messages)
    expect(history).toHaveLength(2)
    expect(history[0]).toEqual({ role: 'user', content: '안녕' })
    expect(history[1]).toEqual({ role: 'assistant', content: '안녕하세요' })
  })

  it('빈 content 메시지는 제외한다', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: '질문' },
      { id: '2', role: 'assistant', content: '' }, // 빈 content
    ]
    const history = buildHistory(messages)
    expect(history).toHaveLength(1)
  })

  it('최대 10개(기본값)로 제한된다', () => {
    const messages: Message[] = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `메시지 ${i}`,
    }))
    const history = buildHistory(messages)
    expect(history).toHaveLength(10)
    // 가장 최신 10개
    expect(history[0].content).toBe('메시지 5')
    expect(history[9].content).toBe('메시지 14')
  })

  it('limit 파라미터로 개수 조정 가능하다', () => {
    const messages: Message[] = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      role: 'user' as const,
      content: `msg ${i}`,
    }))
    expect(buildHistory(messages, 4)).toHaveLength(4)
    expect(buildHistory(messages, 20)).toHaveLength(8)
  })

  it('빈 messages 배열이면 빈 히스토리를 반환한다', () => {
    expect(buildHistory([])).toEqual([])
  })

  it('role과 content만 포함하고 id·citations 등은 제외한다', () => {
    const messages: Message[] = [
      { id: 'abc', role: 'user', content: '질문', citations: [{ index: 1 }] },
    ]
    const history = buildHistory(messages)
    expect(history[0]).toEqual({ role: 'user', content: '질문' })
    expect(history[0]).not.toHaveProperty('id')
    expect(history[0]).not.toHaveProperty('citations')
  })
})
