import Link from 'next/link'
import { calcCompleteness } from '@/lib/profile-completeness'
import type { User, Document, PinnedQA } from '@/lib/types'

interface Props {
  user: Pick<User, 'name' | 'title' | 'bio' | 'photo_url'>
  docs: Document[]
  qaItems: PinnedQA[]
}

export function ProfileCompletenessCard({ user, docs, qaItems }: Props) {
  const { items, percent } = calcCompleteness(user, docs, qaItems)

  if (percent === 100) return null

  return (
    <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-blue-900">프로필 완성도</p>
          <p className="text-xs text-blue-600 mt-0.5">완성할수록 AI 답변 품질이 올라갑니다</p>
        </div>
        <span className="text-2xl font-bold text-blue-700">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-blue-100 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.key}>
            {item.done ? (
              <span className="flex items-center gap-2 text-sm text-blue-400 line-through">
                <svg className="size-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-2 text-sm text-blue-700 font-medium hover:text-blue-900 transition-colors"
              >
                <svg className="size-4 shrink-0 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                </svg>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
