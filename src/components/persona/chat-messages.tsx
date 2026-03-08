'use client'

import { ChatBubble, type Message } from './chat-bubble'

interface Props {
  messages: Message[]
}

export function ChatMessages({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8">
        <p className="text-center text-sm text-zinc-400">
          아래 질문을 선택하거나 직접 입력해서 대화를 시작해보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-4">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
    </div>
  )
}
