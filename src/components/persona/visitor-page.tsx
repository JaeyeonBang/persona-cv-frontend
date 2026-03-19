'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ProfileHeader } from './profile-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { SuggestedQuestionsSheet } from './suggested-questions-sheet'
import { InterviewerSettingsSheet } from './interviewer-settings-sheet'
import { InterviewerConfigProvider, useInterviewerConfig } from '@/contexts/interviewer-config'
import type { Persona, Citation, Document, Theme } from '@/lib/types'
import type { Message } from './chat-bubble'
import { DocumentCarousel } from './document-carousel'

const THEME_STYLES: Record<Theme, {
  wrapper: string
  leftCard: string
  chatCard: string
  chatHeader: string
  chatHeaderText: string
}> = {
  default: {
    wrapper: 'bg-zinc-50',
    leftCard: 'bg-white rounded-[2rem] shadow-sm border border-zinc-100',
    chatCard: 'bg-white shadow-xl rounded-[2rem] border border-zinc-100',
    chatHeader: 'border-b border-zinc-50',
    chatHeaderText: 'text-zinc-600',
  },
  tech: {
    wrapper: 'bg-gray-950',
    leftCard: 'bg-gray-900 rounded-[2rem] border border-gray-800',
    chatCard: 'bg-gray-900 rounded-[2rem] border border-gray-800',
    chatHeader: 'border-b border-gray-800',
    chatHeaderText: 'text-gray-400',
  },
  creative: {
    wrapper: 'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50',
    leftCard: 'bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-violet-100',
    chatCard: 'bg-white/80 backdrop-blur-sm shadow-xl rounded-[2rem] border border-violet-100',
    chatHeader: 'border-b border-violet-50',
    chatHeaderText: 'text-violet-600',
  },
  business: {
    wrapper: 'bg-slate-100',
    leftCard: 'bg-white rounded-xl shadow-sm border border-slate-200',
    chatCard: 'bg-white shadow-md rounded-xl border border-slate-200',
    chatHeader: 'border-b border-slate-100',
    chatHeaderText: 'text-slate-500',
  },
}

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
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { config } = useInterviewerConfig()
  const sessionId = useRef(generateSessionId())
  const scrollRef = useRef<HTMLDivElement>(null)
  const theme = persona.theme ?? 'default'
  const styles = THEME_STYLES[theme] ?? THEME_STYLES.default

  // 채팅창 내부만 자동 스크롤 (페이지 스크롤 없음)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const handleFeedback = useCallback(async (conversationId: string, feedback: 1 | -1) => {
    // 로컬 상태 즉시 업데이트
    setMessages((prev) =>
      prev.map((m) => m.conversationId === conversationId ? { ...m, feedback } : m)
    )
    try {
      await fetch(`/api/conversations/${conversationId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
    } catch {
      // 피드백 저장 실패는 UX에 영향 없이 조용히 처리
    }
  }, [])

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `/${persona.username}`
    const shareData = { title: `${persona.name}의 AI 명함`, url }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try { await navigator.share(shareData); return } catch { /* 취소 */ }
    }
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [persona.username, persona.name])

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
              if (parsed.type === 'conversation_id') {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, conversationId: parsed.id } : m)
                )
              } else if (parsed.type === 'cache_hit') {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, fromCache: true } : m)
                )
              } else if (parsed.type === 'graph_fallback') {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, graphFallback: true } : m)
                )
              } else if (parsed.type === 'status') {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, phase: parsed.phase } : m)
                )
              } else if (parsed.type === 'citations') {
                const citations: Citation[] = parsed.sources
                // citations의 URL/제목으로 documents 매칭 → 인라인 카루셀용
                const citedUrls = new Set(citations.map((c) => c.url).filter(Boolean))
                const citedTitles = new Set(citations.map((c) => c.title))
                const inlineDocuments = documents.filter(
                  (doc) =>
                    (doc.source_url && citedUrls.has(doc.source_url)) ||
                    citedTitles.has(doc.title)
                )
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, citations, inlineDocuments: inlineDocuments.length > 0 ? inlineDocuments : undefined }
                      : m
                  )
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
    <div className={`min-h-dvh md:h-dvh p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto md:overflow-hidden ${styles.wrapper}`}>
      <div className="flex flex-col md:flex-row gap-6 md:h-full">
        {/* Left Column (Profile + Portfolio) */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col gap-6 md:overflow-y-auto">
          <div className={`p-6 lg:p-8 flex flex-col md:shrink-0 ${styles.leftCard}`}>
            <ProfileHeader
              persona={persona}
              socialLinks={documents
                .filter((d): d is typeof d & { source_url: string } =>
                  (d.type === 'github' || d.type === 'linkedin') && !!d.source_url
                )
                .map((d) => ({ type: d.type as 'github' | 'linkedin', url: d.source_url, title: d.title }))}
            />
          </div>
          <DocumentCarousel documents={documents} />
        </div>

        {/* Right Column (Chat) */}
        <div className={`flex-1 flex flex-col overflow-hidden min-w-0 relative h-[70dvh] md:h-auto md:min-h-0 ${styles.chatCard}`}>
          {/* Header */}
          <div className={`flex justify-between items-center p-4 shrink-0 ${styles.chatHeader}`}>
            <div className={`font-semibold text-sm ${styles.chatHeaderText}`}>내 명함 AI</div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                aria-label="명함 공유"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
              >
                {copied ? (
                  <svg className="size-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
                {copied ? '복사됨' : '공유'}
              </button>
              <InterviewerSettingsSheet />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* 스크롤은 이 div 안에서만 발생 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 pt-6 pb-40 scroll-smooth">
              <ChatMessages messages={messages} onFeedback={handleFeedback} />
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
