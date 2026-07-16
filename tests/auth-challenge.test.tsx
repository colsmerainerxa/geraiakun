import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import { AuthChallenge } from "../src/components/storefront/auth-challenge"

test("renders an accessible action-bound bot challenge", () => {
  const html = renderToStaticMarkup(
    <AuthChallenge
      action="register"
      label="Verifikasi keamanan"
      resetSignal={0}
      onTokenChange={() => undefined}
    />,
  )

  assert.match(html, /data-auth-challenge="register"/)
  assert.match(html, /Verifikasi keamanan/)
})

test("new-password forms mirror the bilingual 12-character server policy", () => {
  const registration = readFileSync("src/components/storefront/auth-form.tsx", "utf8")
  const recovery = readFileSync("src/components/storefront/auth-recovery-view.tsx", "utf8")

  assert.match(registration, /\.min\(\s*12,/)
  assert.match(registration, /minLength=\{isRegister \? 12 : undefined\}/)
  assert.match(registration, /Kata sandi minimal 12 karakter/)
  assert.match(registration, /Password must contain at least 12 characters/)
  assert.match(recovery, /password\.length < 12/)
  assert.match(recovery, /minLength=\{12\}/)
  assert.match(recovery, /minimal 12 karakter/)
  assert.match(recovery, /at least 12 characters/)
})
