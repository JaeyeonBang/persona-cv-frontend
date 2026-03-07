'use client'

import { MessageCircleIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface Props {
  questions: string[]
  onSelect: (question: string) => void
}

export function SuggestedQuestionsSheet({ questions, onSelect }: Props) {
  return (
    <Sheet>
      <SheetTrigger className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50">
        <MessageCircleIcon className="size-3.5" />
        추천 질문
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">추천 질문</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2">
          {questions.map((question) => (
            <button
              key={question}
              onClick={() => onSelect(question)}
              className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200"
            >
              {question}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
