import { describe, it, expect } from 'vitest'
import { sanitizeStorageKey } from '@/lib/sanitize-filename'

describe('sanitizeStorageKey', () => {
  it('한글 파일명을 ASCII로 변환한다', () => {
    const result = sanitizeStorageKey('방재연_대학원_성적증명서.pdf')
    expect(result).toMatch(/^[a-zA-Z0-9._\-]+$/)
  })

  it('확장자를 보존한다', () => {
    const result = sanitizeStorageKey('방재연_대학원_성적증명서.pdf')
    expect(result).toMatch(/\.pdf$/)
  })

  it('영문 파일명은 그대로 유지한다', () => {
    const result = sanitizeStorageKey('resume-2024.pdf')
    expect(result).toBe('resume-2024.pdf')
  })

  it('공백을 하이픈으로 치환한다', () => {
    const result = sanitizeStorageKey('my resume final.pdf')
    expect(result).toBe('my-resume-final.pdf')
  })

  it('한글만 있는 파일명은 fallback 이름을 사용한다', () => {
    const result = sanitizeStorageKey('한글만.pdf')
    expect(result).toMatch(/^[a-zA-Z0-9._\-]+$/)
    expect(result).toMatch(/\.pdf$/)
    expect(result.length).toBeGreaterThan(4)
  })

  it('특수문자를 제거한다', () => {
    const result = sanitizeStorageKey('file@name!#$.pdf')
    expect(result).toMatch(/^[a-zA-Z0-9._\-]+$/)
  })

  it('빈 문자열이 들어오면 fallback을 반환한다', () => {
    const result = sanitizeStorageKey('')
    expect(result).toBe('file')
  })

  it('연속된 하이픈을 단일 하이픈으로 줄인다', () => {
    const result = sanitizeStorageKey('my--file.pdf')
    expect(result).toBe('my-file.pdf')
  })
})
