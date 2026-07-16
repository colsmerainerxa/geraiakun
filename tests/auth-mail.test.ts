import assert from "node:assert/strict"
import test from "node:test"
import {
  buildAuthEmail,
  buildLoginOtpEmail,
  resolveMailConfig,
} from "../src/lib/server/auth-mail"

test("builds a localized login OTP email without links or secrets", () => {
  const message = buildLoginOtpEmail({
    locale: "id",
    name: "Aan <Admin>",
    code: "042731",
  })

  assert.equal(message.subject, "Kode login geraiakun")
  assert.match(message.text, /042731/)
  assert.match(message.text, /10 menit/)
  assert.match(message.html, /Aan &lt;Admin&gt;/)
  assert.doesNotMatch(message.html, /password|token|href=/i)
})

test("builds a localized Indonesian verification email with escaped HTML", () => {
  const message = buildAuthEmail({
    purpose: "EMAIL_VERIFY",
    locale: "id",
    name: "Aan <Admin>",
    rawToken: "token/with+symbols",
    appUrl: "https://geraiakun.id",
  })

  assert.equal(message.subject, "Verifikasi email geraiakun")
  assert.equal(message.url, "https://geraiakun.id/id/verifikasi-email?token=token%2Fwith%2Bsymbols")
  assert.match(message.text, /Verifikasi email/)
  assert.match(message.html, /Aan &lt;Admin&gt;/)
  assert.doesNotMatch(message.html, /Aan <Admin>/)
})

test("builds a localized English password-reset email", () => {
  const message = buildAuthEmail({
    purpose: "PASSWORD_RESET",
    locale: "en",
    name: null,
    rawToken: "reset-token",
    appUrl: "https://geraiakun.id/base-path",
  })

  assert.equal(message.subject, "Reset your geraiakun password")
  assert.equal(message.url, "https://geraiakun.id/en/reset-sandi?token=reset-token")
  assert.match(message.text, /30 minutes/)
  assert.match(message.html, /Reset password/)
})

test("builds a staff invitation that sets a password and verifies ownership", () => {
  const message = buildAuthEmail({
    purpose: "STAFF_INVITE",
    locale: "id",
    name: "Staf Baru",
    rawToken: "invite-token",
    appUrl: "https://geraiakun.id",
  })

  assert.equal(message.subject, "Undangan staf geraiakun")
  assert.equal(message.url, "https://geraiakun.id/id/reset-sandi?token=invite-token")
  assert.match(message.text, /atur kata sandi/i)
  assert.match(message.text, /memverifikasi email/i)
})

test("rejects unsafe application origins", () => {
  assert.throws(
    () =>
      buildAuthEmail({
        purpose: "EMAIL_VERIFY",
        locale: "id",
        name: null,
        rawToken: "token",
        appUrl: "javascript:alert(1)",
      }),
    /application URL/i,
  )
  assert.throws(
    () =>
      buildAuthEmail({
        purpose: "EMAIL_VERIFY",
        locale: "id",
        name: null,
        rawToken: "token",
        appUrl: "https://user:pass@geraiakun.id",
      }),
    /application URL/i,
  )
})

test("allows Ethereal only outside production and validates SMTP", () => {
  assert.deepEqual(resolveMailConfig({ EMAIL_TRANSPORT: "ethereal" }, "development"), {
    mode: "ethereal",
    previewEnabled: true,
  })
  assert.throws(() => resolveMailConfig({ EMAIL_TRANSPORT: "ethereal" }, "production"), /Ethereal/i)
  assert.throws(() => resolveMailConfig({ EMAIL_TRANSPORT: "smtp" }, "production"), /SMTP/i)
  assert.deepEqual(
    resolveMailConfig(
      {
        EMAIL_TRANSPORT: "smtp",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        SMTP_USER: "mailer",
        SMTP_PASS: "secret",
        SMTP_FROM: "geraiakun <no-reply@geraiakun.id>",
      },
      "production",
    ),
    {
      mode: "smtp",
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "mailer",
      pass: "secret",
      from: "geraiakun <no-reply@geraiakun.id>",
      previewEnabled: false,
    },
  )
})
