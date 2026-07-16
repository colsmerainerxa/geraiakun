import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { expect, test } from "@playwright/test"
import { Pool } from "pg"
import { hashPassword } from "../src/lib/server/password"

loadEnvConfig(process.cwd())

const email = `codex.auth.mobile.${Date.now()}.${randomUUID().slice(0, 8)}@example.com`
const password = "MobileSecure123!"
const userId = randomUUID()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

test.use({ viewport: { width: 390, height: 844 } })

test.beforeAll(async () => {
  const now = new Date()
  await pool.query(
    `INSERT INTO "User" ("id", "name", "email", "emailVerified", "passwordHash", "role", "sessionVersion", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', 0, $4, $4)`,
    [userId, "Codex Mobile Auth", email, now, await hashPassword(password)],
  )
})

test.afterAll(async () => {
  await pool.query(`DELETE FROM "AccountToken" WHERE "email" = $1`, [email])
  await pool.query(`DELETE FROM "User" WHERE "email" = $1`, [email])
  await pool.end()
})

for (const pageCase of [
  { path: "/id/lupa-sandi", heading: "Pulihkan Kata Sandi" },
  { path: "/en/lupa-sandi", heading: "Reset your password" },
]) {
  test(`${pageCase.path} remains usable on mobile`, async ({ page }) => {
    const consoleProblems: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleProblems.push(message.text())
      }
    })

    await page.goto(pageCase.path)
    await expect(page.getByRole("heading", { name: pageCase.heading })).toBeVisible()
    await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveCount(1, {
      timeout: 20_000,
    })
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
    expect(consoleProblems).toEqual([])
  })
}

for (const pageCase of [
  {
    path: "/id/masuk",
    submit: "Masuk",
    otpHeading: "Verifikasi perangkat baru",
    otpLabel: "Kode OTP",
    resend: /Kirim ulang/,
    back: "Kembali",
  },
  {
    path: "/en/masuk",
    submit: "Sign In",
    otpHeading: "Verify new device",
    otpLabel: "OTP code",
    resend: /Resend/,
    back: "Back",
  },
]) {
  test(`${pageCase.path} new-device OTP remains usable on mobile`, async ({ page }) => {
    test.setTimeout(120_000)
    const consoleProblems: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleProblems.push(message.text())
      }
    })
    page.on("pageerror", (error) => consoleProblems.push(error.message))

    await page.goto(pageCase.path)
    await page.getByLabel("Email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: pageCase.submit, exact: true }).click()
    await expect(page.getByRole("heading", { name: pageCase.otpHeading })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByLabel(pageCase.otpLabel)).toBeVisible()
    await expect(page.getByRole("button", { name: pageCase.resend })).toBeVisible()
    await expect(page.getByRole("button", { name: pageCase.back, exact: true })).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
    expect(consoleProblems).toEqual([])
  })
}
