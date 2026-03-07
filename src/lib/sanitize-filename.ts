/**
 * Supabase Storage key에서 허용하지 않는 non-ASCII 문자를 제거하고
 * URL-safe한 파일명을 반환합니다.
 */
export function sanitizeStorageKey(filename: string): string {
  if (!filename) return 'file'

  const lastDot = filename.lastIndexOf('.')
  const name = lastDot > 0 ? filename.slice(0, lastDot) : filename
  const ext = lastDot > 0 ? filename.slice(lastDot) : ''

  const sanitized = name
    .replace(/[^\x00-\x7F]/g, '')  // non-ASCII 제거 (한글 등)
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')  // 허용 외 문자 → 하이픈
    .replace(/-+/g, '-')            // 연속 하이픈 → 단일 하이픈
    .replace(/^-|-$/g, '')          // 앞뒤 하이픈 제거

  const base = sanitized || 'file'
  return base + ext
}
