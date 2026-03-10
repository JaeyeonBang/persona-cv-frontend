'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { User, PinnedQA } from '@/lib/types'

interface EditableItem extends PinnedQA {
  questionDraft: string
  answerDraft: string
  dirty: boolean
  saving: boolean
}

interface SuggestedItem {
  question: string
  answer: string
  adding: boolean
}

interface Props {
  user: User
  initialItems: PinnedQA[]
}

export function QAClient({ user, initialItems }: Props) {
  const [items, setItems] = useState<EditableItem[]>(
    initialItems.map((i) => ({ ...i, questionDraft: i.question, answerDraft: i.answer, dirty: false, saving: false }))
  )
  const [suggested, setSuggested] = useState<SuggestedItem[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [isSavingNew, setIsSavingNew] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateDraft(id: string, field: 'questionDraft' | 'answerDraft', value: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value, dirty: true } : item))
    )
  }

  async function saveItem(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, saving: true } : i)))
    try {
      const res = await fetch(`/api/pinned-qa?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: item.questionDraft, answer: item.answerDraft }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, question: i.questionDraft, answer: i.answerDraft, dirty: false, saving: false }
            : i
        )
      )
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, saving: false } : i)))
      setError('저장에 실패했습니다')
    }
  }

  async function deleteItem(id: string) {
    try {
      await fetch(`/api/pinned-qa?id=${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      setError('삭제에 실패했습니다')
    }
  }

  async function handleSuggest() {
    setIsSuggesting(true)
    setSuggested([])
    setError(null)
    try {
      const res = await fetch('/api/pinned-qa?action=suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      })
      if (!res.ok) throw new Error()
      const data: { question: string; answer: string }[] = await res.json()
      setSuggested(data.map((d) => ({ ...d, adding: false })))
    } catch {
      setError('AI 질문 생성에 실패했습니다')
    } finally {
      setIsSuggesting(false)
    }
  }

  async function addSuggested(index: number) {
    const item = suggested[index]
    setSuggested((prev) => prev.map((s, i) => (i === index ? { ...s, adding: true } : s)))
    try {
      const res = await fetch('/api/pinned-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          question: item.question,
          answer: item.answer,
          display_order: items.length,
        }),
      })
      if (!res.ok) throw new Error()
      const saved: PinnedQA = await res.json()
      setItems((prev) => [
        ...prev,
        { ...saved, questionDraft: saved.question, answerDraft: saved.answer, dirty: false, saving: false },
      ])
      setSuggested((prev) => prev.filter((_, i) => i !== index))
    } catch {
      setSuggested((prev) => prev.map((s, i) => (i === index ? { ...s, adding: false } : s)))
      setError('추가에 실패했습니다')
    }
  }

  async function saveNewItem() {
    if (!newQuestion.trim() || !newAnswer.trim()) return
    setIsSavingNew(true)
    try {
      const res = await fetch('/api/pinned-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
          display_order: items.length,
        }),
      })
      if (!res.ok) throw new Error()
      const saved: PinnedQA = await res.json()
      setItems((prev) => [
        ...prev,
        { ...saved, questionDraft: saved.question, answerDraft: saved.answer, dirty: false, saving: false },
      ])
      setNewQuestion('')
      setNewAnswer('')
      setIsAdding(false)
    } catch {
      setError('추가에 실패했습니다')
    } finally {
      setIsSavingNew(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="text-base font-bold text-zinc-800">예상 Q&A</h1>
            <p className="text-xs text-zinc-400">면접 예상 질문과 답변을 미리 준비하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-100 transition-colors"
            >
              ← 대시보드
            </Link>
            <Link
              href={`/${user.username}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-800 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              채팅 시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">

        {/* AI 추천 카드 */}
        <div className="mb-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-800">AI 면접 질문 추천</h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                업로드한 자료와 프로필을 분석해 면접관이 물어볼 만한 질문 5개를 자동 생성합니다
              </p>
            </div>
            <button
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="shrink-0 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSuggesting ? 'AI 분석 중...' : 'AI 질문 추천받기'}
            </button>
          </div>
        </div>

        {/* 추천 항목 */}
        {suggested.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">
              추천 질문 — 추가하고 싶은 항목을 선택하세요
            </p>
            <div className="flex flex-col gap-3">
              {suggested.map((s, i) => (
                <div key={i} className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-5">
                  <p className="text-sm font-medium text-zinc-800 mb-1.5">Q. {s.question}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 mb-4">A. {s.answer}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addSuggested(i)}
                      disabled={s.adding}
                      className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {s.adding ? '추가 중...' : '+ 추가'}
                    </button>
                    <button
                      onClick={() => setSuggested((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
                    >
                      건너뛰기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 저장된 Q&A 목록 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">
            저장된 예상 Q&A ({items.length}개)
          </p>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
              <p className="text-sm text-zinc-400">
                저장된 Q&A가 없습니다. 위에서 AI 추천을 받거나 직접 추가하세요.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Q</label>
                      <input
                        value={item.questionDraft}
                        onChange={(e) => updateDraft(item.id, 'questionDraft', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">A</label>
                      <textarea
                        value={item.answerDraft}
                        onChange={(e) => updateDraft(item.id, 'answerDraft', e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {item.dirty ? (
                          <button
                            onClick={() => saveItem(item.id)}
                            disabled={item.saving}
                            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {item.saving ? '저장 중...' : '저장'}
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400">저장됨</span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="size-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 직접 추가 */}
        {isAdding ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-5">
            <p className="text-xs font-semibold text-zinc-500 mb-3">직접 입력</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Q</label>
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="예상 질문을 입력하세요"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">A</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="답변을 입력하세요"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveNewItem}
                  disabled={isSavingNew || !newQuestion.trim() || !newAnswer.trim()}
                  className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingNew ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => { setIsAdding(false); setNewQuestion(''); setNewAnswer('') }}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full rounded-2xl border-2 border-dashed border-zinc-200 py-4 text-sm font-medium text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors"
          >
            + 직접 추가
          </button>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            href={`/${user.username}`}
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-zinc-900 px-8 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-700 hover:shadow-xl"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            완료 — 채팅 시작하기
          </Link>
        </div>
      </main>
    </div>
  )
}
