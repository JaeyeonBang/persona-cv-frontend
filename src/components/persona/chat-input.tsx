'use client'

import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { SendHorizonalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 1000

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled || trimmed.length > MAX_LENGTH) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 py-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        rows={1}
        disabled={disabled}
        placeholder="질문을 입력하세요..."
        className={cn(
          'flex-1 resize-none overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 focus:bg-white disabled:opacity-50',
          'max-h-[120px]'
        )}
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
          text.trim() && !disabled
            ? 'bg-zinc-800 text-white hover:bg-zinc-700'
            : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
        )}
      >
        <SendHorizonalIcon className="size-4" />
        <span className="sr-only">전송</span>
      </button>
    </form>
  )
}
