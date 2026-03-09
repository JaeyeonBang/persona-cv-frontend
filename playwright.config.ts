import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const AUTH_STATE_PATH = path.join(__dirname, 'e2e/.auth/user.json')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    // 1. 로그인 세션 준비 (다른 테스트보다 먼저 실행)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 2. 인증 불필요 테스트
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /document-upload\.spec\.ts/,
    },
    // 3. 인증 필요 테스트 (setup 이후 실행)
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
      },
      testMatch: /document-upload\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
