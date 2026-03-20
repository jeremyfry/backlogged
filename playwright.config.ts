import { defineConfig, devices } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

const tmpDir = path.join(os.tmpdir(), `backlogged-e2e-${crypto.randomBytes(4).toString('hex')}`)
const dbPath = path.join(tmpDir, 'backlogged.db')
const configPath = path.join(tmpDir, 'config.json')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'tsx backend/src/index.ts',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: false,
      env: {
        PORT: '3000',
        DATABASE_PATH: dbPath,
        CONFIG_PATH: configPath,
        JWT_SECRET: 'e2e-test-secret',
        IGDB_CLIENT_ID: '',
        IGDB_CLIENT_SECRET: '',
      },
      timeout: 15000,
    },
    {
      command: 'npm run dev -w frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
})
