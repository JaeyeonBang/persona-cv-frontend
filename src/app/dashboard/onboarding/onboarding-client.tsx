'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PinnedQA } from '@/lib/types'

interface Props {
  username: string
  name: string
}

export function OnboardingClient({ username, name }: Props) {
  const router = useRouter()

  const [items, setItems] = useState<PinnedQA[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [feedback, setFeedback] = useState('')

  async function handleGenerate() {
    if (!question.trim()) return
    setIsGenerating(true)
    setFeedback('')
    try {
      const res = await fetch('/api/pinned-qa?action=generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, question: question.trim() }),
      })
      if (!res.ok) throw new Error('AI 답변 생성에 실패했습니다')
      const data = await res.json()
      setAnswer(data.answer)
      setStep('preview')
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!question.trim() || !answer.trim()) return
    setIsSaving(true)
    setFeedback('')
    try {
      const res = await fetch('/api/pinned-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          question: question.trim(),
          answer: answer.trim(),
          display_order: items.length,
        }),
      })
      if (!res.ok) throw new Error('저장에 실패했습니다')
      const saved: PinnedQA = await res.json()
      setItems((prev) => [...prev, saved])
      setQuestion('')
      setAnswer('')
      setStep('input')
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  function handleComplete() {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-800">예상 Q&A 설정</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{name}님, 방문자가 자주 할 질문을 미리 준비하세요</p>
          </div>
          <button
            onClick={handleComplete}
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 flex flex-col gap-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
          <span className="text-xs text-emerald-600 font-medium">프로필 완료</span>
          <div className="flex-1 h-px bg-zinc-200 mx-1" />
          <div className="size-6 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold">2</div>
          <span className="text-xs text-zinc-800 font-medium">예상 Q&A</span>
        </div>

        {/* Saved items */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">저장된 Q&A ({items.length}개)</p>
            {items.map((item, i) => (
              <div key={item.id} className="rounded-xl bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-800 mb-1">Q{i + 1}. {item.question}</p>
                <p className="text-sm text-zinc-500 line-clamp-2">{item.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 flex flex-col gap-4">
          {step === 'input' ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">예상 질문</span>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="예: 본인의 주요 기술 스택은 무엇인가요?"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                />
              </label>
              {feedback && <p className="text-sm text-red-500">{feedback}</p>}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !question.trim()}
                className="w-full rounded-xl bg-zinc-800 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? 'AI 답변 생성 중...' : 'AI 답변 생성하기'}
              </button>
              {items.length === 0 && (
                <p className="text-xs text-center text-zinc-400">
                  면접, 포트폴리오, 협업 방식 등 다양한 질문을 등록해보세요
                </p>
              )}
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">질문</p>
                <p className="text-sm font-medium text-zinc-800 bg-zinc-50 rounded-xl px-4 py-3">{question}</p>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  AI 생성 답변
                  <span className="ml-2 text-xs font-normal text-zinc-400">직접 수정 가능합니다</span>
                </span>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors resize-none"
                />
              </label>
              {feedback && <p className="text-sm text-red-500">{feedback}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? '저장 중...' : '저장하고 다음 질문 추가'}
                </button>
                <button
                  onClick={() => { setStep('input'); setAnswer('') }}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  다시
                </button>
              </div>
            </>
          )}
        </div>

        {/* Complete button */}
        <button
          onClick={handleComplete}
          className="w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow"
        >
          {items.length > 0 ? `${items.length}개 저장 완료 — 대시보드로 이동` : '건너뛰고 대시보드로 이동'}
        </button>
      </main>
    </div>
  )
}
