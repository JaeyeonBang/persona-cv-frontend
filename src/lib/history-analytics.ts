/** 대화 히스토리 분석 순수 함수 모음 */

export interface ConversationRow {
  id: string
  session_id: string | null
  question: string
  answer: string
  feedback: number | null
  is_cached: boolean
  created_at: string
}

export interface DailyEntry {
  date: string   // YYYY-MM-DD
  label: string  // M/D
  count: number
}

export interface FaqEntry {
  question: string
  count: number
}

/** 최근 N일 대화 수 집계 (today 기준) */
export function buildDailyData(
  conversations: Pick<ConversationRow, 'created_at'>[],
  days = 7,
  today = new Date(),
): DailyEntry[] {
  const daily: DailyEntry[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    const date = d.toISOString().slice(0, 10)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    return { date, label, count: 0 }
  })

  for (const c of conversations) {
    const key = c.created_at.slice(0, 10)
    const day = daily.find((d) => d.date === key)
    if (day) day.count++
  }

  return daily
}

/** 자주 묻는 질문 Top N 집계 */
export function buildFaq(
  conversations: Pick<ConversationRow, 'question'>[],
  topN = 5,
): FaqEntry[] {
  const counts = new Map<string, number>()
  for (const c of conversations) {
    const key = c.question.trim().slice(0, 80)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
}

/** 피드백 만족도(%) 계산. 피드백 없으면 null */
export function calcSatisfactionRate(
  conversations: Pick<ConversationRow, 'feedback'>[],
): number | null {
  const withFeedback = conversations.filter((c) => c.feedback != null)
  if (withFeedback.length === 0) return null
  const positive = withFeedback.filter((c) => c.feedback === 1).length
  return Math.round((positive / withFeedback.length) * 100)
}
