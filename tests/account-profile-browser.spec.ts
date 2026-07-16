import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { expect, test } from "@playwright/test"
import { Pool } from "pg"
import { hashPassword } from "../src/lib/server/password"
import { loginWithCredentials } from "./helpers/auth-browser"

loadEnvConfig(process.cwd())

const email = `codex.profile.audit.${Date.now()}@example.com`
const secondEmail = `codex.profile.audit.second.${Date.now()}@example.com`
const password = "Audit-9274!"
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const userId = randomUUID()
const secondUserId = randomUUID()

test.beforeAll(async () => {
  const now = new Date()
  const passwordHash = await hashPassword(password)
  await pool.query(
    `INSERT INTO "User" ("id", "name", "email", "emailVerified", "passwordHash", "role", "createdAt", "updatedAt", "sessionVersion")
     VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', $4, $4, 0)`,
    [userId, "Codex Profile Audit", email, now, passwordHash],
  )
  await pool.query(
    `INSERT INTO "CustomerProfile" ("id", "userId", "status", "joinedAt", "updatedAt")
     VALUES ($1, $2, 'baru', $3, $3)`,
    [randomUUID(), userId, now],
  )
  await pool.query(
    `INSERT INTO "User" ("id", "name", "email", "emailVerified", "passwordHash", "role", "createdAt", "updatedAt", "sessionVersion")
     VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', $4, $4, 0)`,
    [secondUserId, "Codex Profile Second", secondEmail, now, passwordHash],
  )
  await pool.query(
    `INSERT INTO "CustomerProfile" ("id", "userId", "status", "joinedAt", "updatedAt")
     VALUES ($1, $2, 'baru', $3, $3)`,
    [randomUUID(), secondUserId, now],
  )
})

test.afterAll(async () => {
  await pool.query(`DELETE FROM "User" WHERE "email" IN ($1, $2)`, [email, secondEmail])
  await pool.end()
})

test("persists edited profile values and explicit WhatsApp clearing across reloads", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(180_000)
  await loginWithCredentials(page, email, password)
  await page.getByRole("tab", { name: "Pengaturan" }).click()

  await page.getByLabel("Nama Lengkap").fill("Codex Profile Updated")
  await page.getByLabel("Nomor WhatsApp").fill("0812 9876-5432")
  await page.getByRole("button", { name: "Simpan Profil" }).click()
  await expect(page.getByText("Profil berhasil disimpan")).toBeVisible()

  await page.reload()
  await page.getByRole("tab", { name: "Pengaturan" }).click()
  await expect(page.getByLabel("Nama Lengkap")).toHaveValue("Codex Profile Updated")
  await expect(page.getByLabel("Nomor WhatsApp")).toHaveValue("081298765432")

  await page.getByLabel("Nomor WhatsApp").fill("")
  await page.getByRole("button", { name: "Simpan Profil" }).click()
  await expect(page.getByText("Profil berhasil disimpan")).toBeVisible()

  await page.reload()
  await page.getByRole("tab", { name: "Pengaturan" }).click()
  await expect(page.getByLabel("Nomor WhatsApp")).toHaveValue("")

  const newsletter = page.getByRole("switch", { name: "Newsletter" })
  await expect(newsletter).not.toBeChecked()
  await newsletter.scrollIntoViewIfNeeded()
  const toggleNewsletter = async () => {
    if (testInfo.project.name !== "mobile-chromium") {
      await newsletter.click()
      return
    }

    const box = await newsletter.boundingBox()
    if (!box) throw new Error("Newsletter switch is not visible")
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
  }
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/account/profile") &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
    ),
    toggleNewsletter(),
  ])
  await page.reload()
  await page.getByRole("tab", { name: "Pengaturan" }).click()
  await expect(page.getByRole("switch", { name: "Newsletter" })).toBeChecked()

  await context.clearCookies()
  const unauthorized = await page.evaluate(async () => {
    const get = await fetch("/api/account/profile")
    const patch = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauthorized Audit" }),
    })
    return { get: get.status, patch: patch.status }
  })
  expect(unauthorized).toEqual({ get: 401, patch: 401 })

  await page.goto("/id/akun")
  await expect(page).toHaveURL(/\/id\/masuk\?callbackUrl=/)
  await loginWithCredentials(page, secondEmail, password)
  await page.getByRole("tab", { name: "Pengaturan" }).click()
  await expect(page.getByRole("switch", { name: "Newsletter" })).not.toBeChecked()
})
