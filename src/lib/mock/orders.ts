import type { Order, OrderStatus, PaymentMethod } from "@/types"

const methods: PaymentMethod[] = ["qris", "gopay", "bca-va", "dana", "ovo", "bni-va"]

function mk(
  n: number,
  customerName: string,
  customerEmail: string,
  whatsapp: string,
  items: Order["items"],
  status: OrderStatus,
  createdAt: string,
  paid: boolean,
): Order {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = n % 3 === 0 ? Math.round(subtotal * 0.1) : 0
  const fee = 1000
  const total = subtotal - discount + fee
  return {
    id: `ord-${n}`,
    invoice: `INV-2026${String(n).padStart(4, "0")}`,
    customerName,
    customerEmail,
    whatsapp,
    items,
    subtotal,
    discount,
    fee,
    total,
    status,
    paymentMethod: methods[n % methods.length],
    createdAt,
    paidAt: paid ? createdAt : null,
    credentials: paid
      ? items.map((it) => ({
          email: `akun.${it.productName.toLowerCase().replace(/[^a-z]/g, "")}${n}@premium.mail`,
          password: `Bk!${it.productName.slice(0, 3)}${n}xZ`,
          note: `Login lewat web/aplikasi resmi ${it.productName}. Jangan ganti email & password.`,
          pin: it.variantLabel.includes("Sharing") ? `${1000 + n}` : undefined,
        }))
      : [],
  }
}

export const orders: Order[] = [
  mk(
    1,
    "Rafa Pratama",
    "rafa.pratama@gmail.com",
    "0812-3456-7890",
    [
      {
        productId: "prod-1",
        productName: "ChatGPT Plus",
        productLogo: "🤖",
        variantId: "var-2",
        variantLabel: "1 Bulan Private",
        price: 70000,
        qty: 1,
      },
    ],
    "selesai",
    "2026-06-21T09:12:00",
    true,
  ),
  mk(
    2,
    "Dewi Lestari",
    "dewi.lestari@gmail.com",
    "0813-2222-1111",
    [
      {
        productId: "prod-2",
        productName: "Gemini Pro",
        productLogo: "✨",
        variantId: "var-5",
        variantLabel: "1 Tahun Via Login",
        price: 60000,
        qty: 1,
      },
    ],
    "selesai",
    "2026-06-21T14:40:00",
    true,
  ),
  mk(
    3,
    "Kevin Wijaya",
    "kevin.wijaya@gmail.com",
    "0811-4444-5555",
    [
      {
        productId: "prod-3",
        productName: "API Key",
        productLogo: "🔑",
        variantId: "var-8",
        variantLabel: "Pro — 5 Juta Token",
        price: 10000,
        qty: 1,
      },
    ],
    "selesai",
    "2026-06-22T08:05:00",
    true,
  ),
  mk(
    4,
    "Bagas Saputra",
    "bagas.s@gmail.com",
    "0857-9999-0000",
    [
      {
        productId: "prod-1",
        productName: "ChatGPT Plus",
        productLogo: "🤖",
        variantId: "var-1",
        variantLabel: "1 Bulan Sharing",
        price: 35000,
        qty: 1,
      },
      {
        productId: "prod-2",
        productName: "Gemini Pro",
        productLogo: "✨",
        variantId: "var-3",
        variantLabel: "1 Bulan",
        price: 20000,
        qty: 1,
      },
    ],
    "diproses",
    "2026-06-22T19:25:00",
    true,
  ),
  mk(
    5,
    "Nabila Putri",
    "nabila.putri@gmail.com",
    "0821-7777-8888",
    [
      {
        productId: "prod-2",
        productName: "Gemini Pro",
        productLogo: "✨",
        variantId: "var-4",
        variantLabel: "1 Tahun Via Invite",
        price: 35000,
        qty: 1,
      },
    ],
    "menunggu-pembayaran",
    "2026-06-23T07:50:00",
    false,
  ),
  mk(
    6,
    "Gita Permata",
    "gita.permata@gmail.com",
    "0817-6767-8989",
    [
      {
        productId: "prod-3",
        productName: "API Key",
        productLogo: "🔑",
        variantId: "var-7",
        variantLabel: "Basic — 10 Juta Token",
        price: 10000,
        qty: 2,
      },
    ],
    "selesai",
    "2026-06-20T11:30:00",
    true,
  ),
  mk(
    7,
    "Dimas Arya",
    "dimas.arya@gmail.com",
    "0838-1212-3434",
    [
      {
        productId: "prod-1",
        productName: "ChatGPT Plus",
        productLogo: "🤖",
        variantId: "var-2",
        variantLabel: "1 Bulan Private",
        price: 70000,
        qty: 1,
      },
    ],
    "selesai",
    "2026-06-19T16:10:00",
    true,
  ),
  mk(
    8,
    "Citra Maharani",
    "citra.m@gmail.com",
    "0822-9090-1010",
    [
      {
        productId: "prod-2",
        productName: "Gemini Pro",
        productLogo: "✨",
        variantId: "var-3",
        variantLabel: "1 Bulan",
        price: 20000,
        qty: 1,
      },
    ],
    "menunggu-pembayaran",
    "2026-06-23T06:15:00",
    false,
  ),
  mk(
    9,
    "Fajar Nugroho",
    "fajar.n@gmail.com",
    "0856-2323-4545",
    [
      {
        productId: "prod-3",
        productName: "API Key",
        productLogo: "🔑",
        variantId: "var-6",
        variantLabel: "Trial Gratis",
        price: 0,
        qty: 1,
      },
    ],
    "selesai",
    "2026-06-18T20:00:00",
    true,
  ),
  mk(
    10,
    "Yoga Pranata",
    "yoga.pranata@gmail.com",
    "0813-8080-7070",
    [
      {
        productId: "prod-2",
        productName: "Gemini Pro",
        productLogo: "✨",
        variantId: "var-5",
        variantLabel: "1 Tahun Via Login",
        price: 60000,
        qty: 1,
      },
    ],
    "dibatalkan",
    "2026-06-17T13:45:00",
    false,
  ),
]

export function getOrder(invoice: string) {
  return orders.find((o) => o.invoice.toLowerCase() === invoice.toLowerCase())
}
