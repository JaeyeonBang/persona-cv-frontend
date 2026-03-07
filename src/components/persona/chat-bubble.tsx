import { cn } from '@/lib/utils'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface Props {
  message: Message
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full gap-2', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-zinc-800 text-white rounded-tr-sm'
            : 'bg-white border border-zinc-100 text-zinc-800 shadow-sm rounded-tl-sm'
        )}
      >
        {message.content}
        {message.isStreaming && (
          <span className="ml-1 inline-block animate-pulse text-zinc-400">▋</span>
        )}
      </div>
    </div>
  )
}
