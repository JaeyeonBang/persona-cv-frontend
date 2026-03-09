import { test as setup, expect } from '@playwright/test'
import path from 'path'

export const AUTH_STATE_PATH = path.join(__dirname, '.auth/user.json')

/**
 * 로그인 후 세션 상태를 파일에 저장.
 * 이후 테스트에서 storageState로 재사용 → 매 테스트마다 로그인 불필요.
 *
 * 환경변수:
 *   E2E_TEST_EMAIL    — 테스트 계정 이메일
 *   E2E_TEST_PASSWORD — 테스트 계정 비밀번호
 */
setup('로그인 세션 저장', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_TEST_EMAIL 또는 E2E_TEST_PASSWORD 환경변수가 설정되지 않았습니다.\n' +
      '.env.test 파일에 설정하거나 환경변수로 주입해주세요.'
    )
  }

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')

  // 로그인 성공 시 /dashboard로 리다이렉트
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  await expect(page).toHaveURL(/dashboard/)

  // 세션 쿠키·localStorage 저장
  await page.context().storageState({ path: AUTH_STATE_PATH })
})
