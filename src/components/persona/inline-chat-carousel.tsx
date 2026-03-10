'use client'

import { useState } from 'react'
import type { Document, DocumentType } from '@/lib/types'

const TYPE_LABELS: Record<DocumentType, string> = {
  pdf: 'PDF',
  url: 'Web',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  other: 'Link',
}

const TYPE_COLORS: Record<DocumentType, string> = {
  pdf: 'bg-orange-50 text-orange-600',
  url: 'bg-blue-50 text-blue-600',
  github: 'bg-zinc-100 text-zinc-600',
  linkedin: 'bg-blue-100 text-blue-700',
  other: 'bg-violet-50 text-violet-600',
}

interface Props {
  documents: Document[]
}

export function InlineChatCarousel({ documents }: Props) {
  const [idx, setIdx] = useState(0)
  const doc = documents[idx]

  if (!doc) return null

  const prev = () => setIdx((i) => (i - 1 + documents.length) % documents.length)
  const next = () => setIdx((i) => (i + 1) % documents.length)

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-100">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          참고 자료
        </span>
        {documents.length > 1 && (
          <span className="text-[10px] tabular-nums text-zinc-400">
            {idx + 1} / {documents.length}
          </span>
        )}
      </div>

      {/* 카드 */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* 타입 뱃지 */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[doc.type]}`}
        >
          {TYPE_LABELS[doc.type]}
        </span>

        {/* 제목 + URL */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-700">{doc.title}</p>
          {doc.source_url && (
            <p className="truncate text-[10px] text-zinc-400">{doc.source_url}</p>
          )}
        </div>

        {/* 외부 링크 */}
        {doc.source_url && (
          <a
            href={doc.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex size-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
            aria-label="원문 열기"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* 네비게이션 (문서 2개 이상) */}
      {documents.length > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-1.5">
          <button
            onClick={prev}
            className="flex size-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
            aria-label="이전 자료"
          >
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 도트 인디케이터 */}
          <div className="flex gap-1">
            {documents.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-4 bg-zinc-500' : 'w-1.5 bg-zinc-300'
                }`}
                aria-label={`${i + 1}번 자료`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="flex size-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
            aria-label="다음 자료"
          >
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
