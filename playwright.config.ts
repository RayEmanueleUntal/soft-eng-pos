import { defineConfig, devices } from '@playwright/test';

// Playwright settings for soft-eng-pos.
// Before running tests, start the backend (npm run start:dev, port 3001)
// and the frontend (npm run dev, port 3000).
export default defineConfig({
  testDir: './tests',

  // The tests change data in your local database, so run them one at a time.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure', // keeps a step-by-step recording of every failed test
    screenshot: 'only-on-failure',
  },

  // Chrome only. Firefox and Safari can be added later if the team wants them.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
