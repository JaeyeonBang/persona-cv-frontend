import type { User, Document, PinnedQA } from './types'

export type CompletenessItem = {
  key: string
  label: string
  done: boolean
  href: string
}

export function calcCompleteness(
  user: Pick<User, 'name' | 'title' | 'bio' | 'photo_url'>,
  docs: Document[],
  qaItems: PinnedQA[],
): { items: CompletenessItem[]; percent: number } {
  const hasSocialLink = docs.some(
    (d) => (d.type === 'github' || d.type === 'linkedin') && !!d.source_url,
  )

  const items: CompletenessItem[] = [
    {
      key: 'name',
      label: '이름 · 직책 입력',
      done: !!user.name?.trim() && !!user.title?.trim(),
      href: '/dashboard',
    },
    {
      key: 'bio',
      label: '한줄 소개 작성',
      done: !!user.bio?.trim(),
      href: '/dashboard',
    },
    {
      key: 'photo',
      label: '프로필 사진 업로드',
      done: !!user.photo_url,
      href: '/dashboard',
    },
    {
      key: 'document',
      label: '이력서 / 포트폴리오 등록',
      done: docs.filter((d) => d.type !== 'github' && d.type !== 'linkedin').length > 0,
      href: '/dashboard',
    },
    {
      key: 'social',
      label: 'GitHub / LinkedIn 연결',
      done: hasSocialLink,
      href: '/dashboard',
    },
    {
      key: 'qa',
      label: '예상 Q&A 1개 이상 등록',
      done: qaItems.length > 0,
      href: '/dashboard?tab=qa',
    },
  ]

  const doneCount = items.filter((i) => i.done).length
  const percent = Math.round((doneCount / items.length) * 100)

  return { items, percent }
}
