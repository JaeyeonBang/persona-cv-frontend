'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  username: string
}

export function QRShareSection({ username }: Props) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${username}`

  useEffect(() => {
    // qrcode 패키지를 동적 임포트 (SSR 안전)
    import('qrcode').then((QRCode) => {
      QRCode.default.toDataURL(profileUrl, { width: 200, margin: 2, color: { dark: '#18181b', light: '#ffffff' } })
        .then(setQrDataUrl)
        .catch(() => {})
    })
  }, [profileUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API 미지원 시 무시
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${username}의 AI 명함`, url: profileUrl }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${username}-qr.png`
    a.click()
  }

  return (
    <section className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-zinc-800">명함 공유</h2>
      <p className="mb-4 text-xs text-zinc-400">QR코드를 스캔하거나 URL을 공유하세요</p>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* QR 코드 */}
        <div className="shrink-0 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`${username} QR코드`} className="size-32" />
          ) : (
            <div className="size-32 animate-pulse rounded-lg bg-zinc-200" />
          )}
        </div>

        {/* URL + 버튼 */}
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <span className="flex-1 truncate text-xs text-zinc-500">/{username}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
            >
              {copied ? (
                <>
                  <svg className="size-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  복사됨
                </>
              ) : (
                <>
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  URL 복사
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              공유
            </button>

            {qrDataUrl && (
              <button
                onClick={handleDownload}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                QR 저장
              </button>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </section>
  )
}
