import type { CredentialStock } from "@/types"
import { products } from "./products"

let cid = 0
const statuses: CredentialStock["status"][] = [
  "tersedia",
  "tersedia",
  "terjual",
  "tersedia",
  "kadaluarsa",
]

export const credentials: CredentialStock[] = products.slice(0, 10).flatMap((p) =>
  p.variants.slice(0, 2).flatMap((variant) =>
    Array.from({ length: 3 }, () => {
      cid += 1
      return {
        id: `cred-${cid}`,
        productId: p.id,
        productName: p.name,
        variantLabel: variant.label,
        email: `stock.${p.slug}.${cid}@vault.beliakun`,
        status: statuses[cid % statuses.length],
        addedAt: `2026-06-${String((cid % 28) + 1).padStart(2, "0")}`,
      }
    }),
  ),
)

export function credentialStats() {
  return {
    total: credentials.length,
    tersedia: credentials.filter((c) => c.status === "tersedia").length,
    terjual: credentials.filter((c) => c.status === "terjual").length,
    kadaluarsa: credentials.filter((c) => c.status === "kadaluarsa").length,
  }
}
