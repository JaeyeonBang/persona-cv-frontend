'use client'

import { cn } from '@/lib/utils'
import type { Citation, Document } from '@/lib/types'
import { CitationPopover } from './citation-popover'
import { InlineChatCarousel } from './inline-chat-carousel'

const PHASE_LABELS: Record<string, string> = {
  retrieval: '검색 중',
  generating: '답변 생성 중',
  factcheck: '교정 중',
}

function TypingIndicator({ phase }: { phase?: string }) {
  const label = phase ? (PHASE_LABELS[phase] ?? '처리 중') : '처리 중'
  return (
    <span className="flex items-center gap-2 py-1">
      <span className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="text-xs text-zinc-400">{label}</span>
    </span>
  )
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  phase?: 'retrieval' | 'generating' | 'factcheck'
  citations?: Citation[]
  fromCache?: boolean
  graphFallback?: boolean
  inlineDocuments?: Document[]
  conversationId?: string
  feedback?: 1 | -1 | null
}

interface Props {
  message: Message
  onFeedback?: (conversationId: string, feedback: 1 | -1) => void
}

/** "[1]", "[2]" 마커를 CitationPopover 아이콘으로 치환해서 렌더링 */
function AssistantContent({ content, citations }: { content: string; citations: Citation[] }) {
  if (!citations.length) return <span>{content}</span>

  // [N] 패턴으로 분할
  const parts = content.split(/(\[\d+\])/g)

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/)
        if (match) {
          const idx = parseInt(match[1], 10)
          const citation = citations.find((c) => c.index === idx)
          if (citation) return <CitationPopover key={i} citation={citation} />
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function FeedbackButtons({
  conversationId,
  feedback,
  onFeedback,
}: {
  conversationId: string
  feedback?: 1 | -1 | null
  onFeedback: (id: string, fb: 1 | -1) => void
}) {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <button
        onClick={() => onFeedback(conversationId, 1)}
        className={cn(
          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors',
          feedback === 1
            ? 'bg-emerald-100 text-emerald-700'
            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600',
        )}
        aria-label="도움이 됐어요"
      >
        <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
        {feedback === 1 && <span>좋아요</span>}
      </button>
      <button
        onClick={() => onFeedback(conversationId, -1)}
        className={cn(
          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors',
          feedback === -1
            ? 'bg-red-100 text-red-700'
            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600',
        )}
        aria-label="별로예요"
      >
        <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
        {feedback === -1 && <span>별로예요</span>}
      </button>
    </div>
  )
}

export function ChatBubble({ message, onFeedback }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full gap-2', isUser ? 'justify-end' : 'justify-start')} data-role={message.role}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-zinc-800 text-white rounded-tr-sm'
            : 'bg-white border border-zinc-100 text-zinc-800 shadow-sm rounded-tl-sm'
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <AssistantContent
            content={message.content}
            citations={message.citations ?? []}
          />
        )}
        {!isUser && message.fromCache && !message.isStreaming && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
            <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            이전 답변
          </div>
        )}
        {!isUser && message.graphFallback && !message.isStreaming && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-purple-600 font-medium">
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Graph AI 보강
          </div>
        )}
        {/* 타이핑 인디케이터: 내용 도착 전 */}
        {message.isStreaming && !message.content && <TypingIndicator phase={message.phase} />}
        {/* 교정 중 배지: 텍스트 도착 후 factcheck 단계 */}
        {message.isStreaming && message.content && message.phase === 'factcheck' && (
          <span className="ml-2 text-xs text-zinc-400 animate-pulse">교정 중...</span>
        )}
        {/* 스트리밍 커서: 내용 도착 후 (교정 전) */}
        {message.isStreaming && message.content && message.phase !== 'factcheck' && (
          <span className="ml-1 inline-block animate-pulse text-zinc-400">▋</span>
        )}
        {/* 인라인 참고 자료 카루셀 (스트리밍 완료 후) */}
        {!isUser && !message.isStreaming && message.inlineDocuments && message.inlineDocuments.length > 0 && (
          <InlineChatCarousel documents={message.inlineDocuments} />
        )}
        {/* 피드백 버튼: 완료된 어시스턴트 메시지에만 표시 */}
        {!isUser && !message.isStreaming && message.content && message.conversationId && onFeedback && (
          <FeedbackButtons
            conversationId={message.conversationId}
            feedback={message.feedback}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  )
}
