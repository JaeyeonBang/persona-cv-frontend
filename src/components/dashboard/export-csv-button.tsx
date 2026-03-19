'use client'

import { conversationsToCsv, downloadCsv } from '@/lib/export-conversations'
import type { ConversationRow } from '@/lib/history-analytics'

interface Props {
  conversations: ConversationRow[]
  username: string
}

export function ExportCsvButton({ conversations, username }: Props) {
  function handleExport() {
    const csv = conversationsToCsv(conversations)
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(csv, `${username}-conversations-${date}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      disabled={conversations.length === 0}
      aria-label="대화 내역 CSV 다운로드"
      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      CSV 내보내기
    </button>
  )
}
