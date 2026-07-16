import { loadEnvConfig } from "@next/env"
import { expect, type Page, test } from "@playwright/test"
import { Pool } from "pg"
import { hashIdentifier } from "../src/lib/server/auth-security"
import { completeNewDeviceOtp, loginWithCredentials } from "./helpers/auth-browser"

loadEnvConfig(process.cwd())

const email = `codex.auth.lifecycle.${Date.now()}@example.com`
const rateEmail = `codex.auth.rate.${Date.now()}@example.com`
const originalPassword = "Secure123456!"
const newPassword = "Updated456789!"
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function waitForTurnstile(page: Page) {
  const response = page.locator('input[name="cf-turnstile-response"]')
  await expect(response).toHaveCount(1, { timeout: 20_000 })
  await expect.poll(() => response.inputValue(), { timeout: 20_000 }).not.toBe("")
}

async function messageLink(previewPage: Page, previewUrl: string, path: string) {
  await previewPage.goto(previewUrl)
  let result: string | null = null
  await expect
    .poll(
      async () => {
        for (const frame of previewPage.frames()) {
          const link = frame.locator(`a[href*="${path}"]`).first()
          if ((await link.count()) > 0) {
            result = await link.getAttribute("href")
            if (result) return result
          }
        }
        return null
      },
      { timeout: 20_000 },
    )
    .not.toBeNull()
  if (!result) throw new Error(`Email preview did not contain a link for ${path}`)
  return result
}

test("loads the registration challenge without browser warnings", async ({ page }) => {
  const warnings: string[] = []
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") warnings.push(message.text())
  })

  await page.goto("/id/daftar")
  await waitForTurnstile(page)
  expect(warnings).toEqual([])
})

test.afterAll(async () => {
  const pepper =
    process.env.AUTH_TOKEN_PEPPER ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "geraiakun-dev-token-pepper-change-me"
  const identityHash = hashIdentifier("email", email, pepper)
  const rateIdentityHash = hashIdentifier("email", rateEmail, pepper)
  await pool.query(`DELETE FROM "AccountToken" WHERE "email" = $1`, [email])
  await pool.query(`DELETE FROM "AuthSecurityEvent" WHERE "identityHash" = $1`, [identityHash])
  await pool.query(`DELETE FROM "AuthSecurityEvent" WHERE "identityHash" = $1`, [rateIdentityHash])
  await pool.query(`DELETE FROM "User" WHERE "email" = $1`, [email])
  await pool.end()
})

test("blocks the sixth failed credentials attempt with the durable limiter", async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto("/id/masuk")
  await page.getByLabel("Email").fill(rateEmail)
  await page.locator("#password").fill("WrongPassword123")

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByRole("button", { name: "Masuk", exact: true }).click()
    await expect(page.getByText("Email atau kata sandi tidak sesuai.").last()).toBeVisible({
      timeout: 60_000,
    })
  }

  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(page.getByText(/Terlalu banyak percobaan/)).toBeVisible({
    timeout: 60_000,
  })
})

test("registers, verifies through Ethereal, signs in, and resets the password", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(120_000)

  await page.goto("/id/daftar")
  await page.getByLabel("Nama Lengkap").fill("Codex Auth Lifecycle")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Kata Sandi", { exact: true }).fill(originalPassword)
  await page.getByLabel("Konfirmasi Kata Sandi").fill(originalPassword)
  await waitForTurnstile(page)
  await page.getByRole("button", { name: "Daftar Sekarang" }).click()

  await expect(page.getByText("Periksa email kamu")).toBeVisible({ timeout: 30_000 })
  const verificationPreview = await page
    .getByRole("link", { name: "Buka email pengujian" })
    .getAttribute("href")
  expect(verificationPreview).toMatch(/^https:\/\/ethereal\.email\//)

  await page.goto("/id/masuk")
  await page.getByLabel("Email").fill(email)
  await page.locator("#password").fill(originalPassword)
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(page.getByText("Verifikasi email sebelum masuk.")).toBeVisible()

  const previewPage = await context.newPage()
  const verificationLink = await messageLink(
    previewPage,
    verificationPreview as string,
    "/verifikasi-email?token=",
  )
  await page.goto(verificationLink)
  await page.getByRole("button", { name: "Verifikasi Email" }).click()
  await expect(page.getByText("Email Terverifikasi")).toBeVisible()

  await page.goto("/id/masuk")
  await page.getByLabel("Email").fill(email)
  await page.locator("#password").fill(originalPassword)
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await completeNewDeviceOtp(page)

  const oldSessionContext = await browser.newContext({ storageState: await context.storageState() })
  const oldSessionPage = await oldSessionContext.newPage()
  await oldSessionPage.goto("/id/akun")
  await expect(oldSessionPage).toHaveURL(/\/id\/akun/)

  await context.clearCookies()
  await page.goto("/id/lupa-sandi")
  await page.getByLabel("Email").fill(email)
  await waitForTurnstile(page)
  await page.getByRole("button", { name: "Kirim Tautan Reset" }).click()
  await expect(page.getByText("Periksa Email Kamu")).toBeVisible({ timeout: 30_000 })
  const resetPreview = await page
    .getByRole("link", { name: "Buka email pengujian" })
    .getAttribute("href")
  expect(resetPreview).toMatch(/^https:\/\/ethereal\.email\//)

  const resetLink = await messageLink(previewPage, resetPreview as string, "/reset-sandi?token=")
  await page.goto(resetLink)
  await page.getByLabel("Kata sandi baru").fill(newPassword)
  await page.getByLabel("Konfirmasi kata sandi").fill(newPassword)
  await page.getByRole("button", { name: "Perbarui Kata Sandi" }).click()
  await expect(page.getByRole("heading", { name: "Kata Sandi Diperbarui" })).toBeVisible()

  await oldSessionPage.reload()
  await expect(oldSessionPage).toHaveURL(/\/id\/masuk\?callbackUrl=/)
  await oldSessionContext.close()

  await page.goto("/id/masuk")
  await page.getByLabel("Email").fill(email)
  await page.locator("#password").fill(originalPassword)
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(page.getByText("Email atau kata sandi tidak sesuai.")).toBeVisible({
    timeout: 30_000,
  })

  await loginWithCredentials(page, email, newPassword)

  await previewPage.close()
})
