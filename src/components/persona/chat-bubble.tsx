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
}

interface Props {
  message: Message
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

export function ChatBubble({ message }: Props) {
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
      </div>
    </div>
  )
}
