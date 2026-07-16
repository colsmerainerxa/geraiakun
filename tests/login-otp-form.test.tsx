import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import { LoginOtpForm } from "../src/components/storefront/login-otp-form"

test("OTP form exposes one-time-code semantics and a masked destination", () => {
  const noop = async () => {}
  const html = renderToStaticMarkup(
    <LoginOtpForm
      maskedEmail="c******r@example.com"
      expiresAt="2026-07-16T00:10:00.000Z"
      resendAt="2026-07-16T00:01:00.000Z"
      onVerify={noop}
      onResend={noop}
      onCancel={noop}
    />,
  )

  assert.match(html, /autocomplete="one-time-code"/i)
  assert.match(html, /inputmode="numeric"/i)
  assert.match(html, /maxlength="6"/i)
  assert.match(html, /c\*\*\*\*\*\*r@example\.com/)
  assert.doesNotMatch(html, />customer@example\.com</)
})
