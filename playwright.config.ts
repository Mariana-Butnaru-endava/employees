import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env.ts';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: env.devBaseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run server',
      url: `${env.baseURL}${env.healthEndpoint}`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      url: env.devBaseURL,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
