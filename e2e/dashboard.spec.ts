import { test, expect } from '@playwright/test'

// 미인증 상태 테스트 (미들웨어 auth guard 검증)
test.describe('대시보드 — 미인증 상태', () => {
  test('/dashboard 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })

  test('리다이렉트 후 로그인 폼이 표시된다', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('/dashboard?tab=history도 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard?tab=history')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })
})
