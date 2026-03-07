const MAX_PDF_SIZE = 20 * 1024 * 1024  // 20MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024  // 5MB

/** PDF 파일 유효성 검사. 유효하면 null, 오류 메시지 문자열 반환 */
export function validatePdfFile(file: File): string | null {
  if (file.type !== 'application/pdf') return 'PDF 파일만 업로드 가능합니다'
  if (file.size > MAX_PDF_SIZE) return '파일 크기는 20MB 이하여야 합니다'
  return null
}

/** 이미지 파일 유효성 검사. 유효하면 null, 오류 메시지 문자열 반환 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return '이미지 파일만 업로드 가능합니다'
  if (file.size > MAX_IMAGE_SIZE) return '파일 크기는 5MB 이하여야 합니다'
  return null
}
