import { expect, type Page } from "@playwright/test"

export async function etherealOtpCode(page: Page, previewUrl: string) {
  const previewPage = await page.context().newPage()
  await previewPage.goto(previewUrl)
  let code: string | null = null
  await expect
    .poll(
      async () => {
        for (const frame of previewPage.frames()) {
          const styledCode = frame.locator('p[style*="letter-spacing"]').first()
          if ((await styledCode.count()) > 0) {
            const value = (await styledCode.textContent())?.trim() ?? ""
            if (/^\d{6}$/.test(value)) {
              code = value
              return value
            }
          }
          const text = await frame
            .locator("body")
            .innerText()
            .catch(() => "")
          if (/Kode ini berlaku selama 10 menit|code expires in 10 minutes/i.test(text)) {
            const match = text.match(/\b\d{6}\b/)
            if (match) {
              code = match[0]
              return code
            }
          }
        }
        return null
      },
      { timeout: 30_000 },
    )
    .not.toBeNull()
  await previewPage.close()
  if (!code) throw new Error("Ethereal login email did not contain a six-digit OTP")
  return code
}

export async function completeNewDeviceOtp(page: Page) {
  await expect(page.getByRole("heading", { name: "Verifikasi perangkat baru" })).toBeVisible({
    timeout: 30_000,
  })
  const previewUrl = await page
    .getByRole("link", { name: "Buka email pengujian" })
    .getAttribute("href")
  expect(previewUrl).toMatch(/^https:\/\/ethereal\.email\//)
  const code = await etherealOtpCode(page, previewUrl as string)
  await page.getByLabel("Kode OTP").fill(code)
  await page.getByRole("button", { name: "Verifikasi dan masuk" }).click()
  await expect(page).toHaveURL(/\/id\/akun/, { timeout: 60_000 })
}

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
  options: { expectOtp?: boolean } = {},
) {
  await page.goto("/id/masuk")
  await page.getByLabel("Email").fill(email)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  if (options.expectOtp === false) {
    await expect(page).toHaveURL(/\/id\/akun/, { timeout: 60_000 })
    return
  }
  await completeNewDeviceOtp(page)
}
