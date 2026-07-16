"use client"

import { useServerInsertedHTML } from "next/navigation"

export function JsonLdScript({ id, html }: { id: string; html: string }) {
  useServerInsertedHTML(() => {
    if (typeof window !== "undefined") return null

    return (
      <script
        id={id}
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized and escaped on the server.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  })

  return null
}
