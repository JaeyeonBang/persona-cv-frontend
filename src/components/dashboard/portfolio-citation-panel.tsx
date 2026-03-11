'use client'

import { useState } from 'react'
import type { Document, DocumentType } from '@/lib/types'
import { filterCitableDocs } from '@/lib/qa-citation'

const TYPE_ICON: Record<DocumentType, string> = {
  pdf: '📄',
  url: '🔗',
  github: '',
  linkedin: '',
  other: '📎',
}

interface Props {
  documents: Document[]
  onCite: (doc: Document) => void
  disabled?: boolean
}

export function PortfolioCitationPanel({ documents, onCite, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const citableDocs = filterCitableDocs(documents)

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <svg
          className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        📎 포트폴리오에서 인용
        {citableDocs.length > 0 && (
          <span className="ml-1 bg-zinc-100 px-1.5 py-0.5 rounded-full text-zinc-400">
            {citableDocs.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          {citableDocs.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-1">
              업로드된 문서가 없습니다. 설정 탭에서 문서를 추가하세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {citableDocs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-600 truncate flex items-center gap-1.5">
                    <span>{TYPE_ICON[doc.type]}</span>
                    <span className="truncate max-w-[240px]">{doc.title}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { onCite(doc); setOpen(false) }}
                    disabled={disabled}
                    className="shrink-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-40"
                  >
                    인용
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
