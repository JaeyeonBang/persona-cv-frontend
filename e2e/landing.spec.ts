import { test, expect } from '@playwright/test'

test.describe('랜딩 페이지', () => {
  test('페이지가 올바르게 로드된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('PersonaID')
    await expect(page.locator('text=당신을 대신하는 AI 명함')).toBeVisible()
  })

  test('내 명함 만들기 버튼이 미인증 상태에서 로그인 페이지로 이동한다', async ({ page }) => {
    await page.goto('/')
    await page.click('text=내 명함 만들기')
    // 미들웨어: 미인증 → /dashboard 접근 시 /login 리다이렉트
    await expect(page).toHaveURL(/\/login/)
  })

  test('데모 체험하기 버튼이 demo-user 페이지로 이동한다', async ({ page }) => {
    await page.goto('/')
    await page.click('text=데모 체험하기')
    // /demo → 307 redirect → /demo-user (Next.js 클라이언트 라우터 경유)
    await page.waitForURL(/demo-user/, { timeout: 20000 })
    await expect(page).toHaveURL(/demo-user/)
  })
})
