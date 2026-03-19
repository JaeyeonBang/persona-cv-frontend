import { createAdminClient } from '@/lib/supabase/admin'
import { HistoryClient } from './history-client'
import {
  buildDailyData,
  buildFaq,
  calcSatisfactionRate,
  type ConversationRow,
} from '@/lib/history-analytics'

interface Props {
  userId: string
  username: string
}

export async function HistorySection({ userId, username }: Props) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('conversations')
    .select('id, session_id, question, answer, feedback, is_cached, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  const conversations = (data ?? []) as ConversationRow[]

  const { data: userData } = await supabase
    .from('users')
    .select('view_count')
    .eq('id', userId)
    .maybeSingle()
  const viewCount = (userData as { view_count?: number } | null)?.view_count ?? 0
  const faq = buildFaq(conversations)
  const recent = conversations.slice(0, 50)
  const daily = buildDailyData(conversations)
  const maxDailyCount = Math.max(...daily.map((d) => d.count), 1)
  const satisfactionRate = calcSatisfactionRate(conversations)

  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <h2 className="text-sm font-semibold text-zinc-800">대화 히스토리</h2>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-zinc-800">{conversations.length}</p>
          <p className="mt-1 text-xs text-zinc-400">총 대화 수</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-zinc-800">{viewCount.toLocaleString()}</p>
          <p className="mt-1 text-xs text-zinc-400">페이지 뷰</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-zinc-800">{faq.length > 0 ? faq[0].count : 0}</p>
          <p className="mt-1 text-xs text-zinc-400">최다 질문 횟수</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-zinc-800">
            {satisfactionRate != null ? `${satisfactionRate}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-zinc-400">만족도</p>
        </div>
      </div>

      {/* 일별 대화 추이 */}
      <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-800">최근 7일 대화 추이</h2>
        <div className="flex items-end gap-2 h-20">
          {daily.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs text-zinc-500 font-medium">{d.count > 0 ? d.count : ''}</span>
              <div
                className="w-full rounded-t-md bg-zinc-800 transition-all"
                style={{ height: `${Math.max((d.count / maxDailyCount) * 56, d.count > 0 ? 4 : 2)}px` }}
              />
              <span className="text-[10px] text-zinc-400">{d.label}</span>
            </div>
          ))}
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

      {/* Recent conversations — interactive (delete / edit / clear) */}
      <HistoryClient initialConversations={recent} userId={userId} username={username} />
    </div>
  )
}
