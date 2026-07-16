import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { expect, type Page, test } from "@playwright/test"
import { Pool } from "pg"
import { hashPassword } from "../src/lib/server/password"
import { loginWithCredentials } from "./helpers/auth-browser"

loadEnvConfig(process.cwd())

const suffix = `${Date.now()}.${randomUUID().slice(0, 8)}`
const adminEmail = `codex.staff.admin.${suffix}@example.com`
const staffEmail = `codex.staff.invite.${suffix}@example.com`
const adminPassword = "AdminSecure123!"
const staffPassword = "StaffSecure456!"
const adminId = randomUUID()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function messageLink(previewPage: Page, previewUrl: string) {
  await previewPage.goto(previewUrl)
  let result: string | null = null
  await expect
    .poll(
      async () => {
        for (const frame of previewPage.frames()) {
          const link = frame.locator('a[href*="/reset-sandi?token="]').first()
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
  if (!result) throw new Error("Staff invitation preview did not contain its reset link")
  return result
}

test.beforeAll(async () => {
  await pool.query(
    `INSERT INTO "User" ("id", "name", "email", "emailVerified", "passwordHash", "role", "sessionVersion", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW(), $4, 'ADMIN', 0, NOW(), NOW())`,
    [adminId, "Codex Staff Admin", adminEmail, await hashPassword(adminPassword)],
  )
  await pool.query(
    `INSERT INTO "AdminStaff" ("id", "userId", "role", "status", "twoFactorEnabled", "createdAt", "updatedAt")
     VALUES ($1, $2, 'ADMIN', 'active', false, NOW(), NOW())`,
    [randomUUID(), adminId],
  )
})

test.afterAll(async () => {
  await pool.query(`DELETE FROM "AccountToken" WHERE "email" IN ($1, $2)`, [adminEmail, staffEmail])
  await pool.query(`DELETE FROM "User" WHERE "email" IN ($1, $2)`, [adminEmail, staffEmail])
  await pool.end()
})

test("admin invitation verifies staff email while setting the initial password", async ({
  browser,
}) => {
  test.setTimeout(120_000)
  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await loginWithCredentials(adminPage, adminEmail, adminPassword)

  const response = await adminContext.request.post("/api/admin/team", {
    headers: { Origin: "http://localhost:3100" },
    data: { name: "Codex Invited Staff", email: staffEmail, role: "operations" },
  })
  expect(response.status()).toBe(200)
  const invitation = (await response.json()) as { id: string; previewUrl: string | null }
  expect(invitation.previewUrl).toMatch(/^https:\/\/ethereal\.email\//)

  const invited = await pool.query(
    `SELECT s."status", u."emailVerified", u."passwordHash"
     FROM "AdminStaff" s JOIN "User" u ON u."id" = s."userId"
     WHERE u."email" = $1`,
    [staffEmail],
  )
  expect(invited.rows[0]).toMatchObject({
    status: "invited",
    emailVerified: null,
    passwordHash: null,
  })

  const previewPage = await adminContext.newPage()
  const inviteLink = await messageLink(previewPage, invitation.previewUrl as string)
  const staffContext = await browser.newContext()
  const staffPage = await staffContext.newPage()
  const browserErrors: string[] = []
  staffPage.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  staffPage.on("pageerror", (error) => browserErrors.push(error.message))
  await staffPage.goto(inviteLink)
  await staffPage.getByLabel("Kata sandi baru").fill(staffPassword)
  await staffPage.getByLabel("Konfirmasi kata sandi").fill(staffPassword)
  await staffPage.getByRole("button", { name: "Perbarui Kata Sandi" }).click()
  await expect(staffPage.getByRole("heading", { name: "Kata Sandi Diperbarui" })).toBeVisible()

  const activated = await pool.query(
    `SELECT s."status", u."emailVerified", u."passwordHash"
     FROM "AdminStaff" s JOIN "User" u ON u."id" = s."userId"
     WHERE u."email" = $1`,
    [staffEmail],
  )
  expect(activated.rows[0].status).toBe("active")
  expect(activated.rows[0].emailVerified).not.toBeNull()
  expect(activated.rows[0].passwordHash).not.toBeNull()

  await loginWithCredentials(staffPage, staffEmail, staffPassword)
  await staffPage.goto("/id/admin")
  await expect(staffPage).toHaveURL(/\/id\/admin/)
  await expect(staffPage.getByRole("heading", { name: "Dashboard" })).toBeVisible()

  const suspended = await adminContext.request.patch("/api/admin/team", {
    headers: { Origin: "http://localhost:3100" },
    data: { id: invitation.id, status: "suspended" },
  })
  expect(suspended.status()).toBe(200)
  await staffPage.reload()
  await expect(staffPage).toHaveURL(/\/id\/masuk\?callbackUrl=/)
  expect(browserErrors).toEqual([])

  await staffContext.close()
  await adminContext.close()
})
