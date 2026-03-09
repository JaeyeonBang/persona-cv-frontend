'use client'

import { useState, useRef, useCallback, useOptimistic, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addDocumentUrl,
  uploadPdfToStorage,
  savePdfDocument,
  deleteStorageFile,
  deleteDocument,
} from '@/app/dashboard/actions'
import type { Document, DocumentType } from '@/lib/types'

interface Props {
  userId: string
  initialDocuments: Document[]
}

type PendingUrl = {
  localId: string
  type: Exclude<DocumentType, 'pdf'>
  title: string
  source_url: string
}

type PendingPdf = {
  localId: string
  storagePath: string
  storageUrl: string
  title: string
}

type ActiveType = DocumentType

const STATUS_LABEL: Record<Document['status'], string> = {
  pending: '대기',
  processing: '처리 중',
  done: '완료',
  error: '오류',
}

const STATUS_COLOR: Record<Document['status'], string> = {
  pending: 'bg-zinc-100 text-zinc-500',
  processing: 'bg-blue-50 text-blue-600',
  done: 'bg-emerald-50 text-emerald-600',
  error: 'bg-red-50 text-red-500',
}

const TYPE_OPTIONS: { value: ActiveType; label: string; placeholder?: string }[] = [
  { value: 'pdf', label: 'PDF 파일 첨부' },
  { value: 'url', label: '노션 / 웹', placeholder: 'https://notion.so/...' },
  { value: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
  { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { value: 'other', label: '기타 링크', placeholder: 'https://...' },
]

export function DocumentSection({ userId, initialDocuments }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [documents, setDocuments] = useOptimistic(initialDocuments)
  const [pendingUrls, setPendingUrls] = useState<PendingUrl[]>([])
  const [pendingPdfs, setPendingPdfs] = useState<PendingPdf[]>([])
  const pendingPdfsRef = useRef<PendingPdf[]>([])

  const [activeType, setActiveType] = useState<ActiveType>('pdf')
  const [urlTitle, setUrlTitle] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPdfUploading, setIsPdfUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // doc_id → 0~100 진행률
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // processing 중인 문서가 있으면 2초마다 폴링
  useEffect(() => {
    const processingIds = documents
      .filter((d) => d.status === 'pending' || d.status === 'processing')
      .map((d) => d.id)

    if (processingIds.length === 0) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    async function poll() {
      const results = await Promise.all(
        processingIds.map((id) =>
          fetch(`/api/document-progress/${id}`)
            .then((r) => r.json())
            .then((data) => ({ id, ...data }))
            .catch(() => null)
        )
      )
      setProgressMap((prev) => {
        const next = { ...prev }
        for (const r of results) {
          if (r) next[r.id] = r.progress ?? 0
        }
        return next
      })

      // 처리 완료/오류 시 페이지 새로고침으로 최신 status 반영
      const finished = results.filter((r) => r && (r.status === 'done' || r.status === 'error'))
      if (finished.length > 0) {
        router.refresh()
      }
    }

    poll()
    pollingRef.current = setInterval(poll, 2000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [documents])

  // pendingPdfs 변경 시 ref 동기화
  useEffect(() => {
    pendingPdfsRef.current = pendingPdfs
  }, [pendingPdfs])

  // 컴포넌트 언마운트 시 미저장 PDF storage 파일 정리
  useEffect(() => {
    return () => {
      const toCleanup = pendingPdfsRef.current
      toCleanup.forEach((p) => deleteStorageFile('documents', p.storagePath))
    }
  }, [])

  const handlePdfFile = useCallback(
    async (file: File) => {
      setInputError(null)
      setIsPdfUploading(true)

      const fd = new FormData()
      fd.append('pdf', file)
      fd.append('userId', userId)
      const result = await uploadPdfToStorage(fd)

      if ('error' in result) {
        setInputError(result.error)
      } else {
        setPendingPdfs((prev) => [
          ...prev,
          {
            localId: Math.random().toString(36).slice(2, 9),
            storagePath: result.path,
            storageUrl: result.url,
            title: result.title,
          },
        ])
      }
      setIsPdfUploading(false)
    },
    [userId],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handlePdfFile(file)
    },
    [handlePdfFile],
  )

  function removePendingPdf(localId: string) {
    const target = pendingPdfs.find((p) => p.localId === localId)
    if (target) deleteStorageFile('documents', target.storagePath)
    setPendingPdfs((prev) => prev.filter((p) => p.localId !== localId))
  }

  const AUTO_TITLE_TYPES: Exclude<DocumentType, 'pdf'>[] = ['github', 'linkedin']

  function resolveTitle(type: Exclude<DocumentType, 'pdf'>, url: string, manualTitle: string): string {
    if (!AUTO_TITLE_TYPES.includes(type)) return manualTitle
    if (type === 'github') return `GitHub — ${url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '') || url}`
    if (type === 'linkedin') return `LinkedIn — ${url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || url}`
    return manualTitle
  }

  function handleStageUrl() {
    const url = urlValue.trim()
    const isAutoTitle = AUTO_TITLE_TYPES.includes(activeType as Exclude<DocumentType, 'pdf'>)
    const title = isAutoTitle ? resolveTitle(activeType as Exclude<DocumentType, 'pdf'>, url, '') : urlTitle.trim()
    setInputError(null)

    if (!isAutoTitle && !title) { setInputError('제목을 입력해주세요'); return }
    if (!url) { setInputError('URL을 입력해주세요'); return }
    try { new URL(url) } catch { setInputError('올바른 URL을 입력해주세요'); return }

    setPendingUrls((prev) => [
      ...prev,
      {
        localId: Math.random().toString(36).slice(2, 9),
        type: activeType as Exclude<DocumentType, 'pdf'>,
        title,
        source_url: url,
      },
    ])
    setUrlTitle('')
    setUrlValue('')
  }

  function removePendingUrl(localId: string) {
    setPendingUrls((prev) => prev.filter((p) => p.localId !== localId))
  }

  async function handleSave() {
    const total = pendingPdfs.length + pendingUrls.length
    if (total === 0) return
    setIsSaving(true)
    setFeedback(null)

    const results = await Promise.all([
      ...pendingPdfs.map((p) =>
        savePdfDocument({ userId, title: p.title, storageUrl: p.storageUrl })
      ),
      ...pendingUrls.map((p) =>
        addDocumentUrl({ userId, type: p.type, title: p.title, source_url: p.source_url })
      ),
    ])

    const failed = results.filter((r) => r.error)
    if (failed.length > 0) {
      setFeedback({ type: 'error', message: `${failed.length}개 저장 실패: ${failed[0].error}` })
    } else {
      // 저장 성공 → pending 초기화 (storage cleanup 불필요)
      pendingPdfsRef.current = []
      setPendingPdfs([])
      setPendingUrls([])
      setFeedback({ type: 'success', message: '저장되었습니다. 문서를 처리 중입니다...' })

      // 저장된 문서 id 수집 후 백그라운드 처리 트리거
      const savedIds = results
        .map((r) => ('id' in r ? r.id : null))
        .filter(Boolean) as string[]
      triggerProcessing(savedIds)
    }
    setIsSaving(false)
  }

  function triggerProcessing(documentIds: string[]) {
    if (!documentIds.length) return
    fetch('/api/process-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.error('[triggerProcessing] Backend error:', res.status, data)
          setFeedback({ type: 'error', message: `문서 처리 요청 실패 (${res.status}): 백엔드 서버를 확인하세요.` })
        }
      })
      .catch((err) => {
        console.error('[triggerProcessing] Network error:', err)
        setFeedback({ type: 'error', message: '백엔드 서버에 접속할 수 없습니다. 서버가 실행 중인지 확인하세요.' })
      })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      const result = await deleteDocument(id)
      if (result.error) setDocuments(initialDocuments)
    })
  }

  const pendingTotal = pendingPdfs.length + pendingUrls.length
  const selectedOption = TYPE_OPTIONS.find((o) => o.value === activeType)!

  return (
    <section className="bg-white rounded-[2rem] p-6 lg:p-8 border border-zinc-100 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-800 mb-6">문서 / 링크</h2>

      {/* Type selector */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setActiveType(opt.value); setInputError(null) }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${activeType === opt.value
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* PDF Drop Zone (activeType === 'pdf'일 때만 표시) */}
      {activeType === 'pdf' && (
        <div className="mb-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 cursor-pointer transition-colors ${isDragOver ? 'border-zinc-500 bg-zinc-100' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400'
              }`}
          >
            {isPdfUploading ? (
              <p className="text-sm text-zinc-500">업로드 중...</p>
            ) : (
              <>
                <svg className="size-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-zinc-400">PDF를 드래그하거나 클릭해서 업로드</p>
                <p className="text-xs text-zinc-300">최대 20MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handlePdfFile(file)
            }}
          />
        </div>
      )}

      {/* URL Input (pdf 외 타입일 때 표시) */}
      {activeType !== 'pdf' && (
        <div className="mb-4 flex flex-col gap-3">
          {!(['github', 'linkedin'] as DocumentType[]).includes(activeType) && (
            <input
              type="text"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              placeholder="제목 (예: 포트폴리오 사이트)"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
            />
          )}
          <div className="flex gap-2">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleStageUrl() } }}
              placeholder={selectedOption.placeholder}
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-colors"
            />
            <button
              onClick={handleStageUrl}
              disabled={(['github', 'linkedin'] as DocumentType[]).includes(activeType) ? !urlValue.trim() : (!urlTitle.trim() || !urlValue.trim())}
              className="shrink-0 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-40"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {inputError && <p className="mb-3 text-sm text-red-500">{inputError}</p>}

      {/* Pending list (미저장) */}
      {pendingTotal > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {pendingPdfs.map((p) => (
            <li
              key={p.localId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <div className="min-w-0 flex items-center gap-2">
                <svg className="size-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="truncate text-sm font-medium text-zinc-700">{p.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">미저장</span>
                <button onClick={() => removePendingPdf(p.localId)} className="text-zinc-300 hover:text-red-400 transition-colors" aria-label="삭제">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
          {pendingUrls.map((p) => (
            <li
              key={p.localId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-700">{p.title}</p>
                <p className="truncate text-xs text-zinc-400">{p.source_url}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">미저장</span>
                <button onClick={() => removePendingUrl(p.localId)} className="text-zinc-300 hover:text-red-400 transition-colors" aria-label="삭제">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Saved document list */}
      {documents.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {documents.map((doc) => {
            const isActive = doc.status === 'pending' || doc.status === 'processing'
            const pct = progressMap[doc.id] ?? 0
            return (
              <li
                key={doc.id}
                className="overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50"
              >
                {/* 프로그레스바 트랙 */}
                {isActive && (
                  <div className="h-0.5 w-full bg-zinc-100">
                    <div
                      className="h-full bg-blue-400 transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-700">{doc.title}</p>
                    {isActive ? (
                      <p className="text-xs text-blue-400">
                        {doc.status === 'pending' ? '대기 중...' : `처리 중 ${pct}%`}
                      </p>
                    ) : doc.status === 'error' && doc.error_message ? (
                      <p className="truncate text-xs text-red-400" title={doc.error_message}>{doc.error_message}</p>
                    ) : doc.source_url ? (
                      <p className="truncate text-xs text-zinc-400">{doc.source_url}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[doc.status]}`}>
                      {STATUS_LABEL[doc.status]}
                    </span>
                    <button onClick={() => handleDelete(doc.id)} className="text-zinc-300 hover:text-red-400 transition-colors" aria-label="삭제">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {documents.length === 0 && pendingTotal === 0 && (
        <p className="mb-4 py-4 text-center text-sm text-zinc-300">등록된 문서가 없습니다</p>
      )}

      {feedback && (
        <p className={`mb-4 text-sm ${feedback.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
          {feedback.message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving || pendingTotal === 0}
        className="w-full rounded-2xl bg-zinc-800 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? '저장 중...' : pendingTotal > 0 ? `저장 (${pendingTotal}개)` : '저장'}
      </button>
    </section>
  )
}
