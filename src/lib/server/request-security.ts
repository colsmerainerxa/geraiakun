export function hasTrustedRequestOrigin(request: Request, applicationUrl: string) {
  const origin = request.headers.get("origin")
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(applicationUrl).origin
  } catch {
    return false
  }
}

export function rejectUntrustedRequestOrigin(request: Request, applicationUrl: string) {
  if (hasTrustedRequestOrigin(request, applicationUrl)) return null

  return Response.json(
    { error: "Forbidden origin" },
    { status: 403, headers: { "Cache-Control": "private, no-store" } },
  )
}
