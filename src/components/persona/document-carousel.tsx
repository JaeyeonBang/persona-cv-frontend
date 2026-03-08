'use client'

import { useState } from 'react'
import type { Document, DocumentType } from '@/lib/types'

interface Props {
  documents: Document[]
}

function typeLabel(type: DocumentType) {
  const map: Record<DocumentType, string> = {
    pdf: 'PDF',
    url: 'Web',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    other: 'Link',
  }
  return map[type]
}

function TypeIcon({ type }: { type: DocumentType }) {
  if (type === 'pdf') {
    return (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
  if (type === 'github') {
    return (
      <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  }
  if (type === 'linkedin') {
    return (
      <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  }
  return (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

const CARD_GRADIENTS: Record<DocumentType, string> = {
  pdf: 'from-orange-500 via-red-500 to-rose-600',
  url: 'from-blue-500 via-cyan-500 to-teal-500',
  github: 'from-zinc-700 via-zinc-800 to-zinc-900',
  linkedin: 'from-blue-600 via-blue-700 to-blue-800',
  other: 'from-violet-500 via-purple-600 to-indigo-600',
}

export function DocumentCarousel({ documents }: Props) {
  const [active, setActive] = useState(0)

  const prev = () => setActive((i) => (i - 1 + documents.length) % documents.length)
  const next = () => setActive((i) => (i + 1) % documents.length)

  // 각 카드의 위치 오프셋 계산 (-2 ~ +2)
  function getOffset(idx: number) {
    let off = idx - active
    // 원형 wrap
    if (off > documents.length / 2) off -= documents.length
    if (off < -documents.length / 2) off += documents.length
    return off
  }

  return (
    <section className="mt-8 w-full">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="h-px flex-1 bg-zinc-200" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">포트폴리오</h2>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      {/* 3D 스테이지 */}
      <div className="relative flex h-64 items-center justify-center" style={{ perspective: '1200px' }}>
        {documents.length === 0 && (
          <div className="flex h-52 w-52 md:w-60 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-center">
            <svg className="size-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-medium text-zinc-400">등록된 자료가 없습니다</p>
            <p className="text-xs text-zinc-300">대시보드에서 문서를 업로드해보세요</p>
          </div>
        )}
        {documents.map((doc, idx) => {
          const off = getOffset(idx)
          const absOff = Math.abs(off)

          // 3개까지만 렌더 (성능)
          if (absOff > 2) return null

          const rotateY = off * 35
          const translateX = off * 200
          const translateZ = absOff === 0 ? 80 : absOff === 1 ? -40 : -120
          const scale = absOff === 0 ? 1 : absOff === 1 ? 0.82 : 0.65
          const opacity = absOff === 0 ? 1 : absOff === 1 ? 0.75 : 0.45
          const zIndex = 10 - absOff

          const gradient = CARD_GRADIENTS[doc.type]

          return (
            <div
              key={doc.id}
              onClick={() => off !== 0 && setActive(idx)}
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              className={`absolute w-52 md:w-60 cursor-pointer select-none`}
            >
              {/* 공통 화이트 디자인 카드 본체 */}
              <div
                className="relative h-52 md:h-56 overflow-hidden rounded-[2rem] bg-white border border-zinc-100 p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* 배경 장식 원 (은은하게 변경) */}
                <div className="absolute -right-8 -top-8 size-32 rounded-full bg-zinc-50" />
                <div className="absolute -bottom-10 -left-6 size-40 rounded-full bg-zinc-50" />

                {/* 타입 뱃지 */}
                <div className="relative mb-4 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                  <TypeIcon type={doc.type} />
                  {typeLabel(doc.type)}
                </div>

                {/* 제목 */}
                <p className="relative mb-2 line-clamp-2 text-sm font-bold leading-snug text-zinc-800">
                  {doc.title}
                </p>

                {/* URL 또는 내용 미리보기 */}
                {doc.source_url ? (
                  <p className="relative line-clamp-1 text-xs text-zinc-500">{doc.source_url}</p>
                ) : doc.content ? (
                  <p className="relative line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {doc.content.slice(0, 80)}…
                  </p>
                ) : null}

                {/* 하단 원문 링크 */}
                {doc.source_url && off === 0 && (
                  <a
                    href={doc.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-4 right-4 rounded-full bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 네비게이션 */}
      <div className={`mt-6 flex items-center justify-center gap-4 ${documents.length === 0 ? 'invisible' : ''}`}>
        <button
          onClick={prev}
          className="flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:border-zinc-300 hover:shadow"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 도트 인디케이터 */}
        <div className="flex gap-1.5">
          {documents.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-zinc-800' : 'w-1.5 bg-zinc-300'
                }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:border-zinc-300 hover:shadow"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
