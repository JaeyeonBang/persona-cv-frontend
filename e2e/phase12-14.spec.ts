import { test, expect } from '@playwright/test'

/**
 * Phase 12-14 E2E 테스트
 *
 * Phase 12: 피드백 (좋아요/별로예요)
 * Phase 13: QR 공유 (대시보드 비인증 시 리다이렉트 확인)
 * Phase 14: 테마 (방문자 페이지 테마 클래스)
 */

// demo 유저 보장
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  await page.goto('/api/demo')
  await page.close()
})

// ── Phase 12: 피드백 버튼 ──────────────────────────────────────────────────────

test.describe('Phase 12 — 피드백 버튼', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-user')
    await page.waitForLoadState('networkidle')
  })

  test('채팅 UI가 정상 로드된다', async ({ page }) => {
    await expect(page.locator('text=내 명함 AI')).toBeVisible({ timeout: 15000 })
    const input = page.locator('textarea, input[type="text"]').first()
    await expect(input).toBeVisible()
  })

  test('AI 응답 후 피드백 버튼이 표시된다', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first()
    await input.fill('안녕하세요')
    await input.press('Enter')

    // 사용자 메시지가 표시되는지 확인
    await expect(page.locator('[data-role="user"]').first()).toBeVisible({ timeout: 10000 })

    // 피드백 버튼이 나타날 때까지 대기 (AI 응답 완료 + conversationId 설정 모두 포함)
    const thumbsUp = page.locator('[aria-label="도움이 됐어요"]')
    const thumbsDown = page.locator('[aria-label="별로예요"]')
    await expect(thumbsUp).toBeVisible({ timeout: 60000 })
    await expect(thumbsDown).toBeVisible({ timeout: 5000 })
  })

  test('피드백 버튼 클릭 시 활성 상태로 변한다', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first()
    await input.fill('간단히 자기소개해줘')
    await input.press('Enter')

    // 피드백 버튼이 나타날 때까지 대기 (AI 응답 완료 + conversationId 설정 모두 포함)
    const thumbsUp = page.locator('[aria-label="도움이 됐어요"]')
    await thumbsUp.waitFor({ state: 'visible', timeout: 60000 })
    await thumbsUp.click()

    // 클릭 후 활성 클래스(emerald) 확인
    await expect(thumbsUp).toHaveClass(/emerald/, { timeout: 3000 })
  })
})

// ── Phase 13: QR 공유 섹션 ───────────────────────────────────────────────────

test.describe('Phase 13 — QR 공유 (비인증)', () => {
  test('비인증 상태에서 /dashboard 접근 시 /login으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })

  test('방문자 페이지에서 URL이 올바른 형식이다', async ({ page }) => {
    await page.goto('/demo-user')
    await page.waitForLoadState('networkidle')
    // URL에 username이 포함돼 있는지 확인
    expect(page.url()).toContain('/demo-user')
  })

  test('/demo-user 페이지가 정상 렌더링된다', async ({ page }) => {
    await page.goto('/demo-user')
    await page.waitForLoadState('networkidle')
    // 페이지가 오류 없이 로드되는지 확인
    await expect(page.locator('text=내 명함 AI')).toBeVisible({ timeout: 15000 })
  })
})

// ── Phase 14: 테마 ────────────────────────────────────────────────────────────

test.describe('Phase 14 — 테마 (방문자 페이지)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-user')
    await page.waitForLoadState('networkidle')
  })

  test('방문자 페이지 최상위 div에 배경 클래스가 적용된다', async ({ page }) => {
    // demo-user의 기본 테마(default) — bg-zinc-50 또는 다른 테마 클래스
    const wrapper = page.locator('div.min-h-dvh, div[class*="bg-"]').first()
    await expect(wrapper).toBeVisible()

    const className = await wrapper.getAttribute('class') ?? ''
    // 어떤 테마든 배경 클래스(bg-)가 있어야 함
    expect(className).toMatch(/bg-/)
  })

  test('채팅 패널이 테마에 맞는 스타일로 렌더링된다', async ({ page }) => {
    // 채팅 패널이 존재하는지 확인
    const chatPanel = page.locator('div[class*="rounded"]').filter({ hasText: '내 명함 AI' })
    await expect(chatPanel.first()).toBeVisible()
  })

  test('4가지 테마 중 하나가 적용돼 있다', async ({ page }) => {
    // 페이지 전체 HTML에서 테마 관련 클래스 확인
    const html = await page.content()
    const hasThemeClass =
      html.includes('bg-zinc-50') ||   // default
      html.includes('bg-gray-950') ||  // tech
      html.includes('from-violet-50') || // creative
      html.includes('bg-slate-100')    // business
    expect(hasThemeClass).toBe(true)
  })
})

// ── 공통: 오류 없음 확인 ──────────────────────────────────────────────────────

test.describe('공통 — 콘솔 에러 없음', () => {
  test('방문자 페이지 로드 시 콘솔 에러가 없다', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/demo-user')
    await page.waitForLoadState('networkidle')

    // Supabase 이미지 403 등 외부 서비스 에러는 제외
    const appErrors = errors.filter(
      (e) => !e.includes('supabase') && !e.includes('Failed to load resource') && !e.includes('net::ERR')
    )
    expect(appErrors).toHaveLength(0)
  })

  test('존재하지 않는 페이지 접근 시 안내 메시지가 표시된다', async ({ page }) => {
    await page.goto('/this-user-does-not-exist-xyz999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=존재하지 않는 명함입니다')).toBeVisible()
  })
})
