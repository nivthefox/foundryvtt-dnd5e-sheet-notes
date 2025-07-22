import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './testing',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:30000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'docker compose -f docker-compose.test.yml up',
    port: 30000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});