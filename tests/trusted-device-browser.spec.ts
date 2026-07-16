import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { expect, test } from "@playwright/test"
import { Pool } from "pg"
import { hashPassword } from "../src/lib/server/password"
import { completeNewDeviceOtp, loginWithCredentials } from "./helpers/auth-browser"

loadEnvConfig(process.cwd())

const suffix = `${Date.now()}.${randomUUID().slice(0, 8)}`
const email = `codex.device.${suffix}@example.com`
const password = "DeviceSecure123!"
const userId = randomUUID()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

test.beforeAll(async () => {
  const now = new Date()
  await pool.query(
    `INSERT INTO "User" ("id", "name", "email", "emailVerified", "passwordHash", "role", "sessionVersion", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', 0, $4, $4)`,
    [userId, "Codex Trusted Device", email, now, await hashPassword(password)],
  )
  await pool.query(
    `INSERT INTO "CustomerProfile" ("id", "userId", "status", "joinedAt", "updatedAt")
     VALUES ($1, $2, 'baru', $3, $3)`,
    [randomUUID(), userId, now],
  )
})

test.afterAll(async () => {
  await pool.query(`DELETE FROM "AccountToken" WHERE "email" = $1`, [email])
  await pool.query(`DELETE FROM "User" WHERE "email" = $1`, [email])
  await pool.end()
})

async function logoutNormally(page: Parameters<typeof loginWithCredentials>[0]) {
  await page.goto("/id/akun")
  await page.getByRole("tab", { name: "Pengaturan" }).click()
  await page.getByRole("button", { name: "Keluar", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Keluar", exact: true }).click()
  await expect(page).toHaveURL(/\/id$/)
}

test("trust is browser-scoped, revocable, and globally invalidates sessions", async ({
  browser,
}) => {
  test.setTimeout(240_000)
  const firstContext = await browser.newContext()
  const firstPage = await firstContext.newPage()

  await loginWithCredentials(firstPage, email, password)
  await logoutNormally(firstPage)
  await loginWithCredentials(firstPage, email, password, { expectOtp: false })

  const secondContext = await browser.newContext()
  const secondPage = await secondContext.newPage()
  await secondPage.goto("/id/masuk")
  await secondPage.getByLabel("Email").fill(email)
  await secondPage.locator("#password").fill(password)
  await secondPage.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(secondPage.getByRole("heading", { name: "Verifikasi perangkat baru" })).toBeVisible({
    timeout: 30_000,
  })
  await completeNewDeviceOtp(secondPage)

  await firstPage.goto("/id/akun")
  await firstPage.getByRole("tab", { name: "Pengaturan" }).click()
  await expect(firstPage.getByRole("heading", { name: "Perangkat tepercaya" })).toBeVisible()
  await expect(firstPage.getByText("Perangkat ini")).toBeVisible()

  const devicesResponse = await firstContext.request.get("/api/account/devices")
  expect(devicesResponse.status()).toBe(200)
  const devices = (await devicesResponse.json()) as Array<{ id: string; current: boolean }>
  expect(devices.filter((device) => device.current)).toHaveLength(1)
  const secondDevice = devices.find((device) => !device.current)
  expect(secondDevice).toBeTruthy()
  const revokeResponse = await firstContext.request.delete("/api/account/devices", {
    headers: { Origin: "http://localhost:3100" },
    data: { mode: "one", deviceId: secondDevice?.id },
  })
  expect(revokeResponse.status()).toBe(200)

  await logoutNormally(secondPage)
  await secondPage.goto("/id/masuk")
  await secondPage.getByLabel("Email").fill(email)
  await secondPage.locator("#password").fill(password)
  await secondPage.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(secondPage.getByRole("heading", { name: "Verifikasi perangkat baru" })).toBeVisible({
    timeout: 30_000,
  })
  await completeNewDeviceOtp(secondPage)

  const revokeAllResponse = await firstContext.request.delete("/api/account/devices", {
    headers: { Origin: "http://localhost:3100" },
    data: { mode: "all" },
  })
  expect(revokeAllResponse.status()).toBe(200)
  expect(await revokeAllResponse.json()).toMatchObject({ ok: true, signOut: true })

  await firstPage.goto("/id/akun")
  await expect(firstPage).toHaveURL(/\/id\/masuk\?callbackUrl=/)
  await secondPage.goto("/id/akun")
  await expect(secondPage).toHaveURL(/\/id\/masuk\?callbackUrl=/)

  await secondContext.close()
  await firstContext.close()
})
