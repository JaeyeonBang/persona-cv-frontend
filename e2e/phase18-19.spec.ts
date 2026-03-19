import { test, expect } from '@playwright/test'

/**
 * Phase 18-19 E2E 테스트
 * Phase 18: 방문자 페이지 공유 버튼
 * Phase 19: 대화 내역 CSV 내보내기
 */

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  await page.goto('/api/demo')
  await page.close()
})

// ── Phase 18: 공유 버튼 ───────────────────────────────────────────────────────

test.describe('Phase 18 — 방문자 페이지 공유 버튼', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-user')
    await page.waitForLoadState('networkidle')
  })

  test('채팅 헤더에 공유 버튼이 표시된다', async ({ page }) => {
    const shareBtn = page.locator('[aria-label="명함 공유"]')
    await expect(shareBtn).toBeVisible({ timeout: 15000 })
  })

  test('공유 버튼 클릭 시 클립보드에 URL이 복사된다', async ({ page, context }) => {
    // 클립보드 권한 허용
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const shareBtn = page.locator('[aria-label="명함 공유"]')
    await shareBtn.waitFor({ state: 'visible', timeout: 15000 })
    await shareBtn.click()

    // 복사됨 상태로 전환 확인
    await expect(page.locator('text=복사됨')).toBeVisible({ timeout: 3000 })
  })

  test('복사 후 2초 뒤 버튼이 원래 상태로 돌아온다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const shareBtn = page.locator('[aria-label="명함 공유"]')
    await shareBtn.waitFor({ state: 'visible', timeout: 15000 })
    await shareBtn.click()
    await expect(page.locator('text=복사됨')).toBeVisible({ timeout: 3000 })

    // 2초 후 원래 텍스트로 복귀
    await expect(page.locator('text=공유')).toBeVisible({ timeout: 4000 })
  })

  test('공유 버튼이 있어도 레이아웃이 깨지지 않는다', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await expect(page.locator('text=내 명함 AI')).toBeVisible({ timeout: 15000 })
    const appErrors = errors.filter(
      (e) => !e.includes('supabase') && !e.includes('Failed to load resource') && !e.includes('net::ERR')
    )
    expect(appErrors).toHaveLength(0)
  })
})

// ── Phase 19: CSV 내보내기 ────────────────────────────────────────────────────

test.describe('Phase 19 — CSV 내보내기 (비인증)', () => {
  test('/dashboard 접근 시 로그인으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard?tab=history')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })
})
