'use client'

import { useState, useTransition } from 'react'
import { saveTheme } from '@/app/dashboard/actions'
import type { Theme } from '@/lib/types'

const THEMES: { value: Theme; label: string; desc: string; preview: string }[] = [
  {
    value: 'default',
    label: '기본',
    desc: '화이트 & 징크',
    preview: 'bg-zinc-50',
  },
  {
    value: 'tech',
    label: '테크',
    desc: '다크 모드 & 인디고',
    preview: 'bg-gray-950',
  },
  {
    value: 'creative',
    label: '크리에이티브',
    desc: '바이올렛 그라데이션',
    preview: 'bg-gradient-to-br from-violet-100 to-pink-100',
  },
  {
    value: 'business',
    label: '비즈니스',
    desc: '슬레이트 & 미니멀',
    preview: 'bg-slate-100',
  },
]

interface Props {
  userId: string
  currentTheme: Theme
}

export function ThemeSection({ userId, currentTheme }: Props) {
  const [selected, setSelected] = useState<Theme>(currentTheme)
  const [isPending, startTransition] = useTransition()
  const [savedTheme, setSavedTheme] = useState<Theme>(currentTheme)
  const [error, setError] = useState<string>()

  const handleSave = () => {
    setError(undefined)
    startTransition(async () => {
      const result = await saveTheme(userId, selected)
      if (result.error) {
        setError(result.error)
      } else {
        setSavedTheme(selected)
      }
    })
  }

  const isDirty = selected !== savedTheme

  return (
    <section className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-zinc-800">방문자 페이지 테마</h2>
      <p className="mb-4 text-xs text-zinc-400">방문자에게 보여질 명함 페이지의 색상 테마를 선택하세요</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {THEMES.map((theme) => (
          <button
            key={theme.value}
            onClick={() => setSelected(theme.value)}
            className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-all ${
              selected === theme.value
                ? 'border-zinc-800 shadow-sm'
                : 'border-zinc-100 hover:border-zinc-300'
            }`}
          >
            {/* 미리보기 */}
            <div className={`h-12 w-full rounded-xl ${theme.preview}`} />
            <div>
              <p className="text-xs font-semibold text-zinc-800">{theme.label}</p>
              <p className="text-[10px] text-zinc-400">{theme.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      {isDirty && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-900 px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '테마 저장'}
          </button>
        </div>
      )}
    </section>
  )
}
