'use client'

import { useState, useCallback, useRef } from 'react'
import { ProfileHeader } from './profile-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { SuggestedQuestionsSheet } from './suggested-questions-sheet'
import { InterviewerSettingsSheet } from './interviewer-settings-sheet'
import { InterviewerConfigProvider, useInterviewerConfig } from '@/contexts/interviewer-config'
import type { Persona } from '@/lib/types'
import type { Message } from './chat-bubble'

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface Props {
  persona: Persona
}

function VisitorPageInner({ persona }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { config } = useInterviewerConfig()
  const sessionId = useRef(generateSessionId())

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return

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

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
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
    [isLoading, config, persona.username]
  )

  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-zinc-50 p-4 md:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto">
      {/* Left Column (Profile & Settings) */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-zinc-100 flex flex-col">
          <ProfileHeader persona={persona} />
        </div>

        {/* Visual References on Desktop (Left panel bottom optionally, or keep it under chat. User asked for bottom center)
            Let's keep the user's specific spec "그 밑 가운데에는 관련한 레퍼런스가" -> bottom center.
            Bottom center of the right side makes sense inside the chat flow constraint.
        */}
      </div>

      {/* Right Column (Chat & References) */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white shadow-xl rounded-[2rem] border border-zinc-100 min-w-0 relative">
        {/* Header for Settings */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-50">
          <div className="font-semibold text-sm text-zinc-600">내 명함 AI</div>
          <InterviewerSettingsSheet />
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-6 pb-40 scroll-smooth">
            <ChatMessages messages={messages} />

            {/* Visual References Area (Bottom Center) */}
            {messages.length > 0 && (
              <div className="mt-12 mb-8 flex flex-col items-center">
                <div className="flex items-center gap-4 w-full max-w-2xl mb-6">
                  <div className="h-px bg-zinc-100 flex-1"></div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest text-center">관련 레퍼런스</h3>
                  <div className="h-px bg-zinc-100 flex-1"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                  {/* Mock References */}
                  {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-video bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 shadow-sm transition-all hover:shadow-md cursor-pointer hover:-translate-y-1">
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <span className="text-xs font-medium text-zinc-500">포트폴리오 {i}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area - Sticky Bottom Inside Container */}
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
  )
}

export function VisitorPage({ persona }: Props) {
  return (
    <InterviewerConfigProvider>
      <VisitorPageInner persona={persona} />
    </InterviewerConfigProvider>
  )
}
