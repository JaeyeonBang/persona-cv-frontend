'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ProfileHeader } from './profile-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { SuggestedQuestionsSheet } from './suggested-questions-sheet'
import { InterviewerSettingsSheet } from './interviewer-settings-sheet'
import { InterviewerConfigProvider, useInterviewerConfig } from '@/contexts/interviewer-config'
import type { Persona, Citation, Document } from '@/lib/types'
import type { Message } from './chat-bubble'
import { DocumentCarousel } from './document-carousel'

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface Props {
  persona: Persona
  documents: Document[]
}

function VisitorPageInner({ persona, documents }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { config } = useInterviewerConfig()
  const sessionId = useRef(generateSessionId())
  const scrollRef = useRef<HTMLDivElement>(null)

  // 채팅창 내부만 자동 스크롤 (페이지 스크롤 없음)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return

      // 현재 완료된 메시지만 히스토리로 — 최근 10개 (5턴)
      const history = messages
        .filter((m) => !m.isStreaming && m.content)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const userMsg: Message = { id: generateId(), role: 'user', content: text }
      const assistantId = generateId()
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', isStreaming: true }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: persona.username,
            question: text,
            history,
            sessionId: sessionId.current,
            config,
          }),
        })

        if (!res.ok || !res.body) {
          const errData = await res.json().catch(() => ({ error: '서버 오류' }))
          throw new Error(errData.error ?? '서버 오류')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        // RAF 배치: 여러 글자를 한 프레임에 묶어 렌더링 블로킹 최소화
        let pendingContent = ''
        let rafId: number | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split('\n\n')
          buffer = events.pop() ?? ''

          for (const event of events) {
            const line = event.trim()
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'cache_hit') {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, fromCache: true } : m)
                )
              } else if (parsed.type === 'graph_fallback') {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, graphFallback: true } : m)
                )
              } else if (parsed.type === 'citations') {
                const citations: Citation[] = parsed.sources
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, citations } : m)
                )
              } else if (parsed.type === 'text') {
                pendingContent += parsed.content
                if (rafId === null) {
                  rafId = requestAnimationFrame(() => {
                    const content = pendingContent
                    pendingContent = ''
                    rafId = null
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, content: m.content + content } : m
                      )
                    )
                  })
                }
              }
            } catch {
              // JSON 파싱 실패한 청크는 무시
            }
          }
        }
        // 스트림 종료 후 미처리 텍스트 flush
        if (rafId !== null) cancelAnimationFrame(rafId)
        if (pendingContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + pendingContent } : m
            )
          )
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '답변을 가져올 수 없습니다'
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: `오류: ${message}`, isStreaming: false } : m)
        )
      } finally {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m)
        )
        setIsLoading(false)
      }
    },
    [isLoading, config, persona.username, messages]
  )

  return (
    <div className="min-h-dvh md:h-dvh bg-zinc-50 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto md:overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 md:h-full">
        {/* Left Column (Profile + Portfolio) */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col gap-6 md:overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-zinc-100 flex flex-col md:shrink-0">
            <ProfileHeader persona={persona} />
          </div>
          <DocumentCarousel documents={documents} />
        </div>

        {/* Right Column (Chat) - 모바일: 70dvh 고정 / 데스크톱: 뷰포트 채움 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white shadow-xl rounded-[2rem] border border-zinc-100 min-w-0 relative h-[70dvh] md:h-auto md:min-h-0">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-zinc-50 shrink-0">
            <div className="font-semibold text-sm text-zinc-600">내 명함 AI</div>
            <InterviewerSettingsSheet />
          </div>

          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* 스크롤은 이 div 안에서만 발생 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 pt-6 pb-40 scroll-smooth">
              <ChatMessages messages={messages} />
            </div>

            {/* Chat Input Area - Sticky Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-6 px-4 md:px-8">
              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] border border-zinc-100">
                <div className="flex items-center gap-2 px-3 pt-2">
                  <SuggestedQuestionsSheet
                    questions={persona.suggestedQuestions}
                    onSelect={sendMessage}
                  />
                </div>
                <ChatInput onSend={sendMessage} disabled={isLoading} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VisitorPage({ persona, documents }: Props) {
  return (
    <InterviewerConfigProvider>
      <VisitorPageInner persona={persona} documents={documents} />
    </InterviewerConfigProvider>
  )
}
