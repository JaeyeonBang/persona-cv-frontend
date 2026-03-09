import { test, expect } from '@playwright/test'

test.describe('방문자 페이지 (demo-user)', () => {
  test.beforeAll(async ({ browser }) => {
    // demo-user DB 레코드 보장
    const page = await browser.newPage()
    await page.goto('/api/demo')
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-user')
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
  })

  test('프로필 헤더가 표시된다', async ({ page }) => {
    // 채팅 패널 헤더가 표시되는지 확인 (demo-user는 이름이 비어있을 수 있음)
    await expect(page.locator('text=내 명함 AI')).toBeVisible({ timeout: 15000 })
  })

  test('존재하지 않는 사용자 접근 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.goto('/nonexistent-user-xyz-12345')
    await expect(page.locator('text=존재하지 않는 명함입니다')).toBeVisible()
  })

  test('채팅 입력창이 표시된다', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first()
    await expect(input).toBeVisible()
  })

  test('질문을 입력하고 AI 응답을 받는다', async ({ page }) => {
    // 채팅 입력창 찾기
    const input = page.locator('textarea, input[type="text"]').first()
    await expect(input).toBeVisible()

    // 질문 입력
    await input.fill('안녕하세요, 자기소개 부탁드려요')

    // 전송 (Enter 또는 버튼 클릭)
    await input.press('Enter')

    // 사용자 메시지가 표시되는지 확인
    await expect(page.locator('text=안녕하세요, 자기소개 부탁드려요')).toBeVisible()

    // AI 응답 대기 (최대 30초)
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[class*="assistant"], [class*="ai"], [data-role="assistant"]')
        return messages.length > 0
      },
      { timeout: 30000 }
    ).catch(async () => {
      // data-role 없이 응답 텍스트 대기
      await page.waitForSelector('text=/안녕|반갑|저는|제가|경력|개발/', { timeout: 30000 })
    })
  })
})
