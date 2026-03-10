'use client'

import { useState } from 'react'
import type { PinnedQA, User } from '@/lib/types'

interface Props {
  user: User
  initialItems: PinnedQA[]
}

export function PinnedQASection({ user, initialItems }: Props) {
  const [items, setItems] = useState<PinnedQA[]>(initialItems)
  const [newQuestion, setNewQuestion] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAnswer, setEditAnswer] = useState('')
  const [editQuestion, setEditQuestion] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleGenerate() {
    if (!newQuestion.trim()) return
    setIsGenerating(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/pinned-qa?action=generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, question: newQuestion.trim() }),
      })
      if (!res.ok) throw new Error('AI 답변 생성에 실패했습니다')
      const data = await res.json()

      // 바로 저장 화면으로 넘어가도록 임시 editing 상태로 진입
      const tempId = `new-${Date.now()}`
      setEditingId(tempId)
      setEditQuestion(newQuestion.trim())
      setEditAnswer(data.answer)
      setNewQuestion('')
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : '오류 발생' })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSaveNew() {
    if (!editQuestion.trim() || !editAnswer.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/pinned-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          question: editQuestion,
          answer: editAnswer,
          display_order: items.length,
        }),
      })
      if (!res.ok) throw new Error('저장에 실패했습니다')
      const saved: PinnedQA = await res.json()
      setItems((prev) => [...prev, saved])
      setEditingId(null)
      setEditQuestion('')
      setEditAnswer('')
      setFeedback({ type: 'success', message: '저장되었습니다' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : '오류 발생' })
    } finally {
      setIsSaving(false)
    }
  }

  function handleStartEdit(item: PinnedQA) {
    setEditingId(item.id)
    setEditQuestion(item.question)
    setEditAnswer(item.answer)
  }

  async function handleSaveEdit(id: string) {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/pinned-qa?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editQuestion, answer: editAnswer }),
      })
      if (!res.ok) throw new Error('수정에 실패했습니다')
      const updated: PinnedQA = await res.json()
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)))
      setEditingId(null)
      setFeedback({ type: 'success', message: '수정되었습니다' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : '오류 발생' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/pinned-qa?id=${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((it) => it.id !== id))
      if (editingId === id) setEditingId(null)
    } catch {
      setFeedback({ type: 'error', message: '삭제에 실패했습니다' })
    }
  }

  const isNewEditing = editingId?.startsWith('new-')

  return (
    <section className="bg-white rounded-[2rem] p-6 lg:p-8 border border-zinc-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">예상 Q&A</h2>
          <p className="text-xs text-zinc-400 mt-0.5">자주 받을 질문과 답변을 미리 준비하세요</p>
        </div>
        <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
          {items.length}개
        </span>
      </div>

      {/* 기존 Q&A 목록 */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="rounded-2xl border border-zinc-200 p-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-500">질문</span>
                  <input
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-500">답변</span>
                  <textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors resize-none"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(item.id)}
                    disabled={isSaving}
                    className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-zinc-800 leading-relaxed">{item.question}</p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="size-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="size-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">{item.answer}</p>
              </div>
            ),
          )}
        </div>
      )}

      {/* 새 Q&A 입력 (AI 생성 후 편집) */}
      {isNewEditing ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-zinc-500">AI가 생성한 답변을 확인하고 수정하세요</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500">질문</span>
            <input
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500">답변</span>
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors resize-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSaveNew}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => { setEditingId(null); setEditQuestion(''); setEditAnswer('') }}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        /* 질문 입력 + AI 생성 버튼 */
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="예상 질문을 입력하세요..."
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !newQuestion.trim()}
              className="shrink-0 rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isGenerating ? 'AI 생성 중...' : 'AI 답변 생성'}
            </button>
          </div>
          <p className="text-xs text-zinc-400">Enter 또는 버튼을 클릭하면 AI가 답변 초안을 생성합니다</p>
        </div>
      )}

      {feedback && (
        <p className={`mt-4 text-sm ${feedback.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
          {feedback.message}
        </p>
      )}
    </section>
  )
}
