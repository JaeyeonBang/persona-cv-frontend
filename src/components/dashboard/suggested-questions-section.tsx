'use client'

import { useState } from 'react'
import { savePersonaConfig } from '@/app/dashboard/actions'
import type { User } from '@/lib/types'

interface Props {
  user: User
}

export function SuggestedQuestionsSection({ user }: Props) {
  const [questions, setQuestions] = useState<string[]>(
    user.persona_config.suggested_questions,
  )
  const [newQuestion, setNewQuestion] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  function addQuestion() {
    const trimmed = newQuestion.trim()
    if (!trimmed || questions.includes(trimmed)) return
    setQuestions((prev) => [...prev, trimmed])
    setNewQuestion('')
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addQuestion()
    }
  }

  async function handleSave() {
    setIsSaving(true)
    setFeedback(null)
    const result = await savePersonaConfig(user.id, {
      ...user.persona_config,
      suggested_questions: questions,
    })
    setFeedback(
      result.error
        ? { type: 'error', message: result.error }
        : { type: 'success', message: '저장되었습니다' },
    )
    setIsSaving(false)
  }

  return (
    <section className="bg-white rounded-[2rem] p-6 lg:p-8 border border-zinc-100 shadow-sm flex flex-col h-full">
      <h2 className="text-lg font-semibold text-zinc-800 mb-6">추천 질문</h2>

      {/* Question list — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-4">
      <ul className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
          >
            <p className="text-sm text-zinc-700">{q}</p>
            <button
              onClick={() => removeQuestion(i)}
              className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors"
              aria-label="삭제"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
        {questions.length === 0 && (
          <li className="py-4 text-center text-sm text-zinc-300">추가된 질문이 없습니다</li>
        )}
      </ul>
      </div>{/* end scrollable */}

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새 질문을 입력하고 Enter 또는 추가 버튼을 누르세요"
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
        />
        <button
          onClick={addQuestion}
          disabled={!newQuestion.trim()}
          className="shrink-0 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-40"
        >
          추가
        </button>
      </div>

      {feedback && (
        <p className={`mt-4 text-sm ${feedback.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
          {feedback.message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 w-full rounded-2xl bg-zinc-800 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </section>
  )
}
