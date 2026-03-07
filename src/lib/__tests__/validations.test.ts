import { describe, it, expect } from 'vitest'
import { validatePdfFile, validateImageFile } from '@/lib/validations'

describe('validatePdfFile', () => {
  function makeFile(name: string, type: string, size: number): File {
    const blob = new Blob(['x'.repeat(size)], { type })
    return new File([blob], name, { type })
  }

  it('유효한 PDF는 통과한다', () => {
    const file = makeFile('resume.pdf', 'application/pdf', 1024)
    expect(validatePdfFile(file)).toBeNull()
  })

  it('PDF가 아닌 파일은 거부한다', () => {
    const file = makeFile('image.png', 'image/png', 1024)
    expect(validatePdfFile(file)).toBe('PDF 파일만 업로드 가능합니다')
  })

  it('20MB 초과 파일은 거부한다', () => {
    const file = makeFile('big.pdf', 'application/pdf', 21 * 1024 * 1024)
    expect(validatePdfFile(file)).toBe('파일 크기는 20MB 이하여야 합니다')
  })

  it('정확히 20MB는 통과한다', () => {
    const file = makeFile('exact.pdf', 'application/pdf', 20 * 1024 * 1024)
    expect(validatePdfFile(file)).toBeNull()
  })
})

describe('validateImageFile', () => {
  function makeFile(name: string, type: string, size: number): File {
    const blob = new Blob(['x'.repeat(size)], { type })
    return new File([blob], name, { type })
  }

  it('유효한 이미지는 통과한다', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    expect(validateImageFile(file)).toBeNull()
  })

  it('이미지가 아닌 파일은 거부한다', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    expect(validateImageFile(file)).toBe('이미지 파일만 업로드 가능합니다')
  })

  it('5MB 초과 파일은 거부한다', () => {
    const file = makeFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024)
    expect(validateImageFile(file)).toBe('파일 크기는 5MB 이하여야 합니다')
  })

  it('정확히 5MB는 통과한다', () => {
    const file = makeFile('exact.jpg', 'image/jpeg', 5 * 1024 * 1024)
    expect(validateImageFile(file)).toBeNull()
  })
})
