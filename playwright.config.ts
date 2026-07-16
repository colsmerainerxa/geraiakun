import { defineConfig, devices } from "@playwright/test"

const testOrigin = "http://localhost:3100"

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*-browser\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: testOrigin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "pnpm dev --port 3100",
    url: testOrigin,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      APP_URL: testOrigin,
      AUTH_URL: testOrigin,
      EMAIL_TRANSPORT: "ethereal",
      EMAIL_PREVIEW_ENABLED: "true",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      TURNSTILE_ALLOWED_HOSTNAMES: "localhost",
    },
  },
})
