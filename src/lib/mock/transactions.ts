import type { Promo, Transaction } from "@/types"
import { orders } from "./orders"

export const transactions: Transaction[] = orders.map((o, i) => ({
  id: `trx-${i + 1}`,
  invoice: o.invoice,
  customerName: o.customerName,
  amount: o.total,
  method: o.paymentMethod,
  status:
    o.status === "selesai"
      ? "berhasil"
      : o.status === "menunggu-pembayaran"
        ? "pending"
        : o.status === "dibatalkan"
          ? "gagal"
          : "berhasil",
  createdAt: o.createdAt,
}))

export const promos: Promo[] = [
  {
    id: "p1",
    code: "GENZHEMAT",
    description: "Diskon 20% semua produk AI",
    type: "persen",
    value: 20,
    minSpend: 50000,
    maxDiscount: 50000,
    used: 342,
    quota: 1000,
    expiresAt: "2026-07-31",
    active: true,
  },
  {
    id: "p2",
    code: "NEWBIE10",
    description: "Potongan Rp10.000 untuk pembeli baru",
    type: "nominal",
    value: 10000,
    minSpend: 30000,
    maxDiscount: null,
    used: 980,
    quota: 2000,
    expiresAt: "2026-12-31",
    active: true,
  },
  {
    id: "p3",
    code: "GAJIAN",
    description: "Diskon 15% tiap tanggal muda",
    type: "persen",
    value: 15,
    minSpend: 100000,
    maxDiscount: 75000,
    used: 124,
    quota: 500,
    expiresAt: "2026-06-30",
    active: true,
  },
  {
    id: "p4",
    code: "STREAMINGMURAH",
    description: "Diskon Rp15.000 kategori streaming",
    type: "nominal",
    value: 15000,
    minSpend: 50000,
    maxDiscount: null,
    used: 567,
    quota: 800,
    expiresAt: "2026-08-15",
    active: true,
  },
  {
    id: "p5",
    code: "FLASHSALE70",
    description: "Flash sale spesial AI tools",
    type: "persen",
    value: 70,
    minSpend: 0,
    maxDiscount: 100000,
    used: 200,
    quota: 200,
    expiresAt: "2026-06-25",
    active: false,
  },
  {
    id: "p6",
    code: "RAMADHAN",
    description: "Promo musiman (kadaluarsa)",
    type: "persen",
    value: 25,
    minSpend: 50000,
    maxDiscount: 60000,
    used: 1500,
    quota: 1500,
    expiresAt: "2026-04-10",
    active: false,
  },
]

export function getPromo(code: string) {
  return promos.find((p) => p.code.toLowerCase() === code.toLowerCase() && p.active)
}
