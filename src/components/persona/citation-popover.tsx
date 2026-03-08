'use client'

import { useState, useRef, useEffect } from 'react'
import type { Citation } from '@/lib/types'

interface Props {
  citation: Citation
}

export function CitationPopover({ citation }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <span ref={ref} className="relative inline-block align-middle">
      <button
        onClick={() => setOpen((v) => !v)}
        className="mx-0.5 inline-flex size-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-200"
        aria-label={`출처 ${citation.index}: ${citation.title}`}
      >
        {citation.index}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-zinc-100 bg-white p-4 shadow-xl">
          {/* 말풍선 꼬리 */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-100" style={{ zIndex: -1 }} />

          <p className="mb-1 text-xs font-semibold text-zinc-800 line-clamp-1">{citation.title}</p>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500 line-clamp-4">{citation.excerpt}</p>

          {citation.url ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
            >
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              원문 보기
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-400">
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF 문서
            </span>
          )}
        </div>
      )}
    </span>
  )
}
