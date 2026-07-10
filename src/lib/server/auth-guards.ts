import { redirect } from "next/navigation"
import { auth } from "@/auth"

function localizedLogin(locale: string, callbackPath: string) {
  const safeLocale = locale === "en" ? "en" : "id"
  const callbackUrl = `/${safeLocale}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`
  return `/${safeLocale}/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`
}

export async function requireCustomerSession(locale: string, callbackPath: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(localizedLogin(locale, callbackPath))
  }
  return session
}

export async function requireAdminSession(locale: string) {
  const session = await requireCustomerSession(locale, "/admin")
  if (session.user.role !== "admin") {
    redirect(`/${locale === "en" ? "en" : "id"}/akun`)
  }
  return session
}
