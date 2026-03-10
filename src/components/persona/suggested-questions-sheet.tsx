'use client'

import { useState } from 'react'
import { MessageCircleIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Props {
  questions: string[]
  onSelect: (question: string) => void
}

export function SuggestedQuestionsSheet({ questions, onSelect }: Props) {
  const [open, setOpen] = useState(false)

  if (!questions.length) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50">
        <MessageCircleIcon className="size-3.5" />
        추천 질문
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-72 p-2"
      >
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          추천 질문
        </p>
        <div className="flex flex-col gap-1">
          {questions.map((question) => (
            <button
              key={question}
              onClick={() => {
                onSelect(question)
                setOpen(false)
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200"
            >
              {question}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
