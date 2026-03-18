'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { User, PinnedQA, Document, DocumentType } from '@/lib/types'
import { insertCitationAtCursor } from '@/lib/qa-citation'

const TYPE_ICON: Record<DocumentType, string> = {
  pdf: '📄',
  url: '🔗',
  github: '',
  linkedin: '',
  other: '📎',
}

const STATUS_LABEL: Record<Document['status'], string> = {
  pending: '대기',
  processing: '처리 중',
  done: '완료',
  error: '오류',
}

const STATUS_COLOR: Record<Document['status'], string> = {
  pending: 'bg-zinc-100 text-zinc-400',
  processing: 'bg-blue-50 text-blue-500',
  done: '',
  error: 'bg-red-50 text-red-400',
}

interface EditableItem extends PinnedQA {
  questionDraft: string
  answerDraft: string
  dirty: boolean
  saving: boolean
}

// 추천 카드: 저장 전 인라인 편집 가능 (answerDraft)
interface SuggestedItem {
  question: string
  answer: string
  answerDraft: string
  adding: boolean
  sources?: { id: string; title: string }[]
}

interface Props {
  user: User
  initialItems: PinnedQA[]
  portfolio?: Document[]
}

export function QAClient({ user, initialItems, portfolio = [] }: Props) {
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

  // onBlur 없이 마지막 포커스 textarea를 추적 — blur race condition 방지
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)

  const answerRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const newAnswerRef = useRef<HTMLTextAreaElement>(null)
  const suggestAnswerRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map())

  // ── Draft updaters ──────────────────────────────────────────────────────────

  function updateDraft(id: string, field: 'questionDraft' | 'answerDraft', value: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value, dirty: true } : item))
    )
  }

  function updateSuggestDraft(index: number, value: string) {
    setSuggested((prev) =>
      prev.map((s, i) => (i === index ? { ...s, answerDraft: value } : s))
    )
  }

  // ── Save / Delete ───────────────────────────────────────────────────────────

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

  // ── Citation ────────────────────────────────────────────────────────────────

  function handleCite(doc: Document, itemId: string) {
    const textarea = answerRefs.current.get(itemId)
    const cursorPos = textarea?.selectionStart ?? -1
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    const pos = cursorPos >= 0 ? cursorPos : item.answerDraft.length
    const { next, newCursorPos } = insertCitationAtCursor(item.answerDraft, pos, doc)
    updateDraft(itemId, 'answerDraft', next)
    requestAnimationFrame(() => {
      const el = answerRefs.current.get(itemId)
      el?.focus()
      el?.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  function handleCiteNew(doc: Document) {
    const textarea = newAnswerRef.current
    const cursorPos = textarea?.selectionStart ?? newAnswer.length
    const { next, newCursorPos } = insertCitationAtCursor(newAnswer, cursorPos, doc)
    setNewAnswer(next)
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  function handleCiteSuggest(doc: Document, index: number) {
    const textarea = suggestAnswerRefs.current.get(index)
    const cursorPos = textarea?.selectionStart ?? -1
    const item = suggested[index]
    if (!item) return
    const pos = cursorPos >= 0 ? cursorPos : item.answerDraft.length
    const { next, newCursorPos } = insertCitationAtCursor(item.answerDraft, pos, doc)
    updateSuggestDraft(index, next)
    requestAnimationFrame(() => {
      const el = suggestAnswerRefs.current.get(index)
      el?.focus()
      el?.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  // 마지막으로 포커스된 textarea에 인용 삽입 (onBlur 제거로 race condition 해결)
  function handleCiteToFocused(doc: Document) {
    if (!focusedItemId) return
    if (focusedItemId === 'new') {
      handleCiteNew(doc)
    } else if (focusedItemId.startsWith('suggest-')) {
      const idx = parseInt(focusedItemId.slice('suggest-'.length), 10)
      handleCiteSuggest(doc, idx)
    } else {
      handleCite(doc, focusedItemId)
    }
  }

  // ── AI 추천 ─────────────────────────────────────────────────────────────────

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
      const data: { question: string; answer: string; sources?: { id: string; title: string }[] }[] =
        await res.json()
      setSuggested(data.map((d) => ({ ...d, answerDraft: d.answer, adding: false })))
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
          answer: item.answerDraft, // 편집된 draft 사용
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

  // ── Render ──────────────────────────────────────────────────────────────────

  // 포트폴리오: done → 인용 가능 / 나머지 → 상태 배지만 표시
  const sortedPortfolio = [...portfolio].sort((a, b) => {
    const order: Record<string, number> = { done: 0, processing: 1, pending: 2, error: 3 }
    return (order[a.status] ?? 4) - (order[b.status] ?? 4)
  })

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* AI 면접 질문 추천 */}
        <section className="bg-white rounded-[1.5rem] p-6 border border-zinc-100 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">AI 면접 질문 추천</h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                업로드한 자료와 프로필을 분석해 면접관이 물어볼 만한 질문 5개와 출처 포함 답변을 자동 생성합니다
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

          {suggested.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              <p className="text-xs font-medium text-zinc-400">
                추천 질문 — 답변을 편집하거나 포트폴리오를 인용한 뒤 추가하세요
              </p>
              {suggested.map((s, i) => (
                <div key={i} className="rounded-2xl border-2 border-dashed border-zinc-200 p-4">
                  <p className="text-sm font-medium text-zinc-800 mb-2">Q. {s.question}</p>

                  {/* 답변 편집 textarea — 인용 가능 */}
                  <label className="flex flex-col gap-1.5 mb-3">
                    <span className="text-xs font-medium text-zinc-400">A. 답변 (편집 후 추가 가능)</span>
                    <textarea
                      ref={(el) => {
                        if (el) suggestAnswerRefs.current.set(i, el)
                        else suggestAnswerRefs.current.delete(i)
                      }}
                      value={s.answerDraft}
                      onChange={(e) => updateSuggestDraft(i, e.target.value)}
                      onFocus={() => setFocusedItemId(`suggest-${i}`)}
                      rows={4}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 leading-relaxed outline-none focus:border-zinc-400 transition-colors resize-none"
                    />
                  </label>

                  {/* 참고 자료 배지 */}
                  {s.sources && s.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs text-zinc-400 mr-0.5">참고 자료:</span>
                      {s.sources.map((src) => (
                        <span
                          key={src.id}
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500"
                        >
                          📄 {src.title.length > 24 ? src.title.slice(0, 24) + '…' : src.title}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => addSuggested(i)}
                      disabled={s.adding}
                      className="rounded-xl bg-zinc-800 px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {s.adding ? '추가 중...' : '+ 추가'}
                    </button>
                    <button
                      onClick={() => setSuggested((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-xl border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
                    >
                      건너뛰기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 저장된 예상 Q&A */}
        <section className="bg-white rounded-[1.5rem] p-6 border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">저장된 예상 Q&A</h2>
              <p className="text-xs text-zinc-400 mt-0.5">답변 클릭 후 우측 포트폴리오에서 인용하세요</p>
            </div>
            <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
              {items.length}개
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center">
              <p className="text-sm text-zinc-400">저장된 Q&A가 없습니다. 위에서 AI 추천을 받거나 직접 추가하세요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-zinc-500">질문</span>
                      <input
                        value={item.questionDraft}
                        onChange={(e) => updateDraft(item.id, 'questionDraft', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 transition-colors"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-zinc-500">답변</span>
                      <textarea
                        ref={(el) => {
                          if (el) answerRefs.current.set(item.id, el)
                          else answerRefs.current.delete(item.id)
                        }}
                        value={item.answerDraft}
                        onChange={(e) => updateDraft(item.id, 'answerDraft', e.target.value)}
                        onFocus={() => setFocusedItemId(item.id)}
                        rows={4}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 transition-colors resize-none"
                      />
                    </label>
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

          {/* 직접 추가 */}
          <div className="mt-4">
            {isAdding ? (
              <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-zinc-500">새 Q&A 직접 입력</p>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-500">질문</span>
                  <input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="예상 질문을 입력하세요"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-500">답변</span>
                  <textarea
                    ref={newAnswerRef}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    onFocus={() => setFocusedItemId('new')}
                    placeholder="답변을 입력하세요"
                    rows={4}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-colors resize-none"
                  />
                </label>
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
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full rounded-2xl border-2 border-dashed border-zinc-200 py-4 text-sm font-medium text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors"
              >
                + 직접 추가
              </button>
            )}
          </div>
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* 채팅 시작 CTA */}
        <div className="flex justify-center pb-2">
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
      </div>

      {/* ── Portfolio sidebar ── */}
      <aside className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-24">
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-800">📁 포트폴리오 인용</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {focusedItemId
                ? '✓ 답변 선택됨 — 문서를 클릭해 인용하세요.'
                : '답변 입력 칸을 클릭하면 인용할 수 있어요.'}
            </p>
          </div>

          {sortedPortfolio.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center">
              <p className="text-xs text-zinc-400 mb-2">업로드된 문서가 없습니다.</p>
              <Link
                href="/dashboard"
                className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
              >
                설정에서 문서 추가하기
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {sortedPortfolio.map((doc) => {
                const isDone = doc.status === 'done'
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        if (!isDone || !focusedItemId) return
                        e.preventDefault()
                        handleCiteToFocused(doc)
                      }}
                      disabled={!isDone || !focusedItemId}
                      title={
                        !isDone
                          ? `${STATUS_LABEL[doc.status]} — 처리 완료 후 인용 가능`
                          : focusedItemId
                          ? `${doc.title} 인용하기`
                          : '답변 입력 칸을 먼저 클릭하세요'
                      }
                      className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        isDone && focusedItemId
                          ? 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-white cursor-pointer'
                          : 'border-zinc-100 bg-zinc-50/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="shrink-0 text-sm">{TYPE_ICON[doc.type]}</span>
                      <span className="flex-1 min-w-0 text-xs text-zinc-700 truncate">{doc.title}</span>
                      {isDone && focusedItemId ? (
                        <span className="shrink-0 text-xs font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">
                          인용
                        </span>
                      ) : !isDone ? (
                        <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-md ${STATUS_COLOR[doc.status]}`}>
                          {STATUS_LABEL[doc.status]}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-300 text-center">
              {sortedPortfolio.filter((d) => d.status === 'done').length}개 인용 가능 / 전체 {sortedPortfolio.length}개
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
