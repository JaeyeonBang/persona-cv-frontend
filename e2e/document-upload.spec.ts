import { test, expect, Page } from '@playwright/test'
import path from 'path'

const PDF_FILE = path.resolve(
  __dirname,
  '../../backend/tests/files_for_test/방재연_이력서.pdf'
)

async function goToDashboard(page: Page) {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
}

// 문서/링크 섹션
function docSection(page: Page) {
  return page.locator('section').filter({ hasText: '문서 / 링크' })
}

// 대시보드는 로그인 필요 — 인증 세션 설정 없이는 /login으로 리다이렉트됨
// 인증된 E2E 테스트는 별도 auth session fixture 구성 후 활성화 예정
test.describe('PDF 업로드 E2E', () => {
  test('PDF 업로드 → 스테이징 → 저장 → 처리 완료', async ({ page }) => {
    await goToDashboard(page)
    const section = docSection(page)

    // 1. PDF 파일 첨부 탭 확인
    await expect(section.locator('button:text("PDF 파일 첨부")')).toBeVisible()

    // 2. hidden file input에 PDF 세팅 (업로드 → Supabase Storage)
    await section.locator('input[type="file"][accept="application/pdf"]').setInputFiles(PDF_FILE)

    // 3. 스테이징 목록에 파일명 표시 (업로드 완료 후) - "미저장" 배지가 있는 항목
    const stagingItem = section.locator('li').filter({ hasText: '미저장' }).filter({ hasText: '방재연_이력서' })
    await expect(stagingItem.first()).toBeVisible({ timeout: 15000 })

    // 4. 저장 버튼 클릭
    const saveButton = section.getByRole('button', { name: /저장/ })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // 5. 저장 성공 피드백
    await expect(section.locator('text=저장되었습니다')).toBeVisible({ timeout: 10000 })

    // 6. 새로 저장된 방재연_이력서 항목이 "완료"로 바뀔 때까지 대기 (최대 90초)
    // 저장 후 최신 항목(첫 번째 li)에서 "완료" 확인
    const pdfDocItem = section.locator('li').filter({ hasText: '방재연_이력서' }).first()
    await expect(pdfDocItem.locator('span:text("완료")')).toBeVisible({ timeout: 90000 })
  })
})

test.describe('URL 링크 추가 E2E', () => {
  test('빈 입력 / 잘못된 URL 시 에러 메시지 표시', async ({ page }) => {
    await goToDashboard(page)
    const section = docSection(page)

    // 1. "노션 / 웹" 탭 클릭
    await section.locator('button:text("노션 / 웹")').click()

    const titleInput = section.locator('input[placeholder="제목 (예: 포트폴리오 사이트)"]')
    const urlInput = section.locator('input[type="url"]')
    const addButton = section.getByRole('button', { name: '추가' })

    // 2. 제목만 입력, URL 없으면 버튼 disabled
    await titleInput.fill('테스트 제목')
    await expect(addButton).toBeDisabled()

    // 3. 제목 + 잘못된 URL → 버튼 활성화, 클릭 시 에러
    await urlInput.fill('not-a-valid-url')
    await expect(addButton).toBeEnabled()
    await addButton.click()
    await expect(section.locator('text=올바른 URL을 입력해주세요')).toBeVisible()

    // 4. 올바른 URL → 스테이징 성공
    await urlInput.fill('https://www.notion.so/my-page')
    await addButton.click()
    await expect(section.locator('text=테스트 제목')).toBeVisible()
    await expect(section.locator('text=미저장').first()).toBeVisible()
  })

  test('GitHub URL 추가 → 저장 → 처리 완료', async ({ page }) => {
    await goToDashboard(page)
    const section = docSection(page)

    // 1. "GitHub" 탭 클릭
    await section.locator('button:text("GitHub")').click()
    await expect(section.locator('input[placeholder*="github.com"]')).toBeVisible()

    // 2. 제목 + URL 입력
    await section.locator('input[placeholder="제목 (예: 포트폴리오 사이트)"]').fill('내 GitHub')
    await section.locator('input[type="url"]').fill('https://github.com/JaeyeonBang')

    // 3. 추가 버튼 클릭
    await section.getByRole('button', { name: '추가' }).click()

    // 4. 스테이징 확인
    await expect(section.locator('text=내 GitHub')).toBeVisible()
    await expect(section.locator('text=미저장').first()).toBeVisible()

    // 5. 저장
    const saveButton = section.getByRole('button', { name: /저장/ })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // 6. 저장 피드백
    await expect(section.locator('text=저장되었습니다')).toBeVisible({ timeout: 10000 })

    // 7. 처리 완료 대기 (URL 크롤링 + 임베딩, 최대 90초)
    await expect(section.locator('span:text("완료")')).toBeVisible({ timeout: 90000 })
  })

  test('URL 스테이징 후 X 버튼으로 제거', async ({ page }) => {
    await goToDashboard(page)
    const section = docSection(page)

    await section.locator('button:text("노션 / 웹")').click()
    await section.locator('input[placeholder="제목 (예: 포트폴리오 사이트)"]').fill('삭제될 문서')
    await section.locator('input[type="url"]').fill('https://example.com')
    await section.getByRole('button', { name: '추가' }).click()

    await expect(section.locator('text=삭제될 문서')).toBeVisible()

    // 미저장 항목의 X 버튼 클릭
    const pendingItem = section.locator('li').filter({ hasText: '삭제될 문서' })
    await pendingItem.locator('button[aria-label="삭제"]').click()

    await expect(section.locator('text=삭제될 문서')).not.toBeVisible()
  })
})
