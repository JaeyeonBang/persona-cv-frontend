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

function buildFaq(conversations: ConversationRow[]): { question: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const c of conversations) {
    const key = c.question.trim().slice(0, 80)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export async function HistorySection({ userId }: Props) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('conversations')
    .select('id, session_id, question, answer, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  const conversations = (data ?? []) as ConversationRow[]
  const sessionCount = new Set(conversations.map((c) => c.session_id).filter(Boolean)).size
  const faq = buildFaq(conversations)
  const recent = conversations.slice(0, 50)

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-zinc-800">{conversations.length}</p>
          <p className="mt-1 text-xs text-zinc-400">총 대화 수</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-zinc-800">{sessionCount}</p>
          <p className="mt-1 text-xs text-zinc-400">방문 세션 수</p>
        </div>
        <div className="hidden rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm text-center sm:block">
          <p className="text-2xl font-bold text-zinc-800">{faq.length > 0 ? faq[0].count : 0}</p>
          <p className="mt-1 text-xs text-zinc-400">최다 질문 횟수</p>
        </div>
      </div>

      {/* Top 5 FAQ */}
      {faq.length > 0 && (
        <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-800">자주 묻는 질문 Top 5</h2>
          <ol className="flex flex-col gap-2">
            {faq.map(({ question, count }, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-zinc-50 px-4 py-3">
                <span className="w-4 shrink-0 text-xs font-bold text-zinc-400">{i + 1}</span>
                <p className="line-clamp-2 flex-1 text-xs text-zinc-700">{question}</p>
                <span className="shrink-0 text-xs font-medium text-zinc-400">{count}회</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Recent conversations */}
      <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800">최근 대화</h2>
          <span className="text-xs text-zinc-400">{recent.length}건</span>
        </div>

        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">아직 대화 기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((c) => (
              <li key={c.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-xs font-medium text-zinc-700">{c.question}</p>
                  <time className="shrink-0 text-xs text-zinc-400">{formatDate(c.created_at)}</time>
                </div>
                <p className="line-clamp-2 text-xs text-zinc-500">{c.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
