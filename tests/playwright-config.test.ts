import assert from "node:assert/strict"
import test from "node:test"
import playwrightConfig from "../playwright.config"

test("Playwright child server cannot inherit production mail or Turnstile credentials", () => {
  const webServer = Array.isArray(playwrightConfig.webServer)
    ? playwrightConfig.webServer[0]
    : playwrightConfig.webServer

  assert.ok(webServer)
  assert.deepEqual(
    {
      EMAIL_TRANSPORT: webServer.env?.EMAIL_TRANSPORT,
      EMAIL_PREVIEW_ENABLED: webServer.env?.EMAIL_PREVIEW_ENABLED,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: webServer.env?.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      TURNSTILE_SECRET_KEY: webServer.env?.TURNSTILE_SECRET_KEY,
      TURNSTILE_ALLOWED_HOSTNAMES: webServer.env?.TURNSTILE_ALLOWED_HOSTNAMES,
    },
    {
      EMAIL_TRANSPORT: "ethereal",
      EMAIL_PREVIEW_ENABLED: "true",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      TURNSTILE_ALLOWED_HOSTNAMES: "localhost",
    },
  )
})
