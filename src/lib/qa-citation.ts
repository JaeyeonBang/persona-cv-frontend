import type { Document } from '@/lib/types'

/**
 * textarea 커서 위치에 인용 문자열을 삽입한다.
 * 원본 문자열을 변경하지 않고 새 문자열을 반환한다.
 */
export function insertCitationAtCursor(
  current: string,
  cursorPos: number,
  doc: Document,
): { next: string; newCursorPos: number } {
  const citation = formatCitation(doc)
  const safePos = Math.min(Math.max(0, cursorPos), current.length)
  const next = current.slice(0, safePos) + citation + current.slice(safePos)
  return { next, newCursorPos: safePos + citation.length }
}

/** 문서를 인용 텍스트로 포맷한다. */
export function formatCitation(doc: Document): string {
  return `[출처: ${doc.title}]`
}

/** 인용 가능한 문서만 필터링한다 (done 상태인 문서). */
export function filterCitableDocs(docs: Document[]): Document[] {
  return docs.filter((d) => d.status === 'done')
}
