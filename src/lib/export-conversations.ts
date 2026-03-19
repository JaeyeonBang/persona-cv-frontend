import type { ConversationRow } from './history-analytics'

export function conversationsToCsv(rows: ConversationRow[]): string {
  const header = ['날짜', '질문', '답변', '피드백']
  const escape = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`

  const lines = rows.map((r) => {
    const date = new Date(r.created_at).toLocaleString('ko-KR')
    const feedback = r.feedback === 1 ? '👍' : r.feedback === -1 ? '👎' : ''
    return [date, r.question, r.answer, feedback].map(escape).join(',')
  })

  return [header.join(','), ...lines].join('\n')
}

export function downloadCsv(csv: string, filename: string) {
  const bom = '\uFEFF' // UTF-8 BOM for Excel
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
