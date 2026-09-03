import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // Use the already-built staging bundle so Playwright is not coupled to
    // tsx's IPC server (which is restricted in this environment).
    command: 'PORT=4173 NODE_ENV=production node --env-file=.env.staging dist/server.cjs',
    cwd: '.',
    url: 'http://localhost:4173',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
