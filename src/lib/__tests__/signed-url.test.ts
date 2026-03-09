import { describe, it, expect } from 'vitest'

// extractStoragePath 로직을 직접 테스트 (page.tsx에서 추출)
function extractStoragePath(url: string): string | null {
  const match = url.match(/\/object\/(?:public|sign)\/documents\/(.+?)(?:\?|$)/)
  return match ? match[1] : null
}

describe('extractStoragePath', () => {
  it('getPublicUrl 형식 URL에서 버킷 내 경로를 추출한다', () => {
    const url = 'https://xcfiodnsliigewingfjw.supabase.co/storage/v1/object/public/documents/pdfs/user-id/file.pdf'
    expect(extractStoragePath(url)).toBe('pdfs/user-id/file.pdf')
  })

  it('Signed URL 형식(/object/sign/)에서도 경로를 추출한다', () => {
    const url = 'https://xcfiodnsliigewingfjw.supabase.co/storage/v1/object/sign/documents/pdfs/user-id/file.pdf?token=abc123'
    expect(extractStoragePath(url)).toBe('pdfs/user-id/file.pdf')
  })

  it('쿼리 파라미터가 있어도 경로만 반환한다', () => {
    const url = 'https://example.supabase.co/storage/v1/object/public/documents/pdfs/uuid/filename.pdf?v=1'
    expect(extractStoragePath(url)).toBe('pdfs/uuid/filename.pdf')
  })

  it('storage URL 형식이 아니면 null 반환한다', () => {
    expect(extractStoragePath('https://example.com/file.pdf')).toBeNull()
    expect(extractStoragePath('pdfs/user-id/file.pdf')).toBeNull()
    expect(extractStoragePath('')).toBeNull()
  })

  it('한글 파일명이 인코딩된 URL도 처리한다', () => {
    const url = 'https://example.supabase.co/storage/v1/object/public/documents/pdfs/uid/1773055974239-__260131.pdf'
    expect(extractStoragePath(url)).toBe('pdfs/uid/1773055974239-__260131.pdf')
  })

  it('중첩 경로도 처리한다', () => {
    const url = 'https://example.supabase.co/storage/v1/object/public/documents/a/b/c/file.pdf'
    expect(extractStoragePath(url)).toBe('a/b/c/file.pdf')
  })
})
