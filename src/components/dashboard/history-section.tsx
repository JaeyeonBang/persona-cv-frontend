import { createAdminClient } from '@/lib/supabase/admin'

interface ConversationRow {
  id: string
  session_id: string | null
  question: string
  answer: string
  created_at: string
}

interface Props {
  userId: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function HistorySection({ userId }: Props) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('conversations')
    .select('id, session_id, question, answer, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const conversations = (data ?? []) as ConversationRow[]

  return (
    <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">대화 히스토리</h2>
        <span className="text-xs text-zinc-400">{conversations.length}건</span>
      </div>

      {conversations.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">아직 대화 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {conversations.map((c) => (
            <li key={c.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-700 line-clamp-1">{c.question}</p>
                <time className="shrink-0 text-xs text-zinc-400">{formatDate(c.created_at)}</time>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2">{c.answer}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
