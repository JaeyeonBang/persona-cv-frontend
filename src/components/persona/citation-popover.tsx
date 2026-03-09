'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Citation } from '@/lib/types'

interface Props {
  citation: Citation
}

export function CitationPopover({ citation }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, above: true })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const popoverHeight = 160 // 팝오버 예상 높이
    const above = rect.top > popoverHeight + 16

    setPos({
      top: above ? rect.top - 8 : rect.bottom + 8,
      left: rect.left + rect.width / 2,
      above,
    })

    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <span className="inline-block align-middle">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="mx-0.5 inline-flex size-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-200"
        aria-label={`출처 ${citation.index}: ${citation.title}`}
      >
        {citation.index}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: pos.above
              ? 'translate(-50%, -100%)'
              : 'translate(-50%, 0)',
            zIndex: 9999,
          }}
          className="w-80 rounded-xl border border-zinc-100 bg-white shadow-xl"
        >
          {/* 말풍선 꼬리 */}
          {pos.above ? (
            <>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-100" style={{ zIndex: -1 }} />
            </>
          ) : (
            <>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-white" />
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-100" style={{ zIndex: -1 }} />
            </>
          )}

          {/* 인용 본문 */}
          <div className="border-b border-zinc-50 px-4 py-3">
            <p className="text-xs leading-relaxed text-zinc-700">
              &ldquo;{citation.excerpt}&rdquo;
            </p>
          </div>

          {/* 출처 정보 */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <svg className="size-3 shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="truncate text-[11px] text-zinc-400">{citation.title}</p>
            </div>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-zinc-700"
              >
                <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                원문
              </a>
            )}
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}
