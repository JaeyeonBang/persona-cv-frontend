'use client'

import { useState, useRef } from 'react'
import type { ConversationRow } from '@/lib/history-analytics'
import { ExportCsvButton } from './export-csv-button'

interface Props {
  initialConversations: ConversationRow[]
  userId: string
  username: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryClient({ initialConversations, userId, username }: Props) {
  const [conversations, setConversations] = useState(initialConversations)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function startEdit(c: ConversationRow) {
    setEditingId(c.id)
    setEditDraft(c.answer)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  async function saveEdit(id: string) {
    if (!editDraft.trim()) return
    setSavingId(id)
    // 낙관적 업데이트
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, answer: editDraft } : c))
    )
    setEditingId(null)
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: editDraft }),
      })
    } catch {
      // 실패 시 롤백
      setConversations(initialConversations)
    } finally {
      setSavingId(null)
    }
  }

  async function deleteOne(id: string) {
    // 낙관적 제거
    setConversations((prev) => prev.filter((c) => c.id !== id))
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    } catch {
      setConversations(initialConversations)
    }
  }

  async function clearAll() {
    if (!window.confirm('전체 대화 기록을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return
    setClearing(true)
    setConversations([])
    try {
      await fetch('/api/conversations/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
    } catch {
      setConversations(initialConversations)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">
          최근 대화
          <span className="ml-2 text-xs font-normal text-zinc-400">{conversations.length}건</span>
        </h2>
        <div className="flex items-center gap-2">
          <ExportCsvButton conversations={conversations} username={username} />
          <button
            onClick={clearAll}
            disabled={clearing || conversations.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-500 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            전체 삭제
          </button>
        </div>
      </div>

      {conversations.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">대화 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {conversations.map((c) => (
            <li key={c.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              {/* 질문 헤더 */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="line-clamp-1 text-xs font-medium text-zinc-700">{c.question}</p>
                  {c.is_cached && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                      <svg className="size-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      캐시
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {c.feedback === 1 && <span className="text-xs text-emerald-600">👍</span>}
                  {c.feedback === -1 && <span className="text-xs text-red-500">👎</span>}
                  <time className="text-xs text-zinc-400">{formatDate(c.created_at)}</time>
                  {/* 수정 버튼 */}
                  {editingId !== c.id && (
                    <button
                      onClick={() => startEdit(c)}
                      aria-label="답변 수정"
                      className="flex size-6 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => deleteOne(c.id)}
                    aria-label="대화 삭제"
                    className="flex size-6 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-100 hover:text-red-500"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 답변 — 편집 모드 or 표시 모드 */}
              {editingId === c.id ? (
                <div className="mt-2">
                  <textarea
                    ref={textareaRef}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none"
                  />
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => saveEdit(c.id)}
                      disabled={savingId === c.id || !editDraft.trim()}
                      className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                    >
                      {savingId === c.id ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="line-clamp-2 text-xs text-zinc-500">{c.answer}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
