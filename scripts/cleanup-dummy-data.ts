import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

const dummyTicketCodes = ["TKT-001", "TKT-002", "TKT-003"]
const dummyPromoCodes = [
  "GENZHEMAT",
  "NEWBIE10",
  "GAJIAN",
  "STREAMINGMURAH",
  "FLASHSALE70",
  "RAMADHAN",
]
const dummyReviewers = [
  "Rizky Pratama",
  "Siti Nurhaliza",
  "Bagus Wicaksono",
  "Andini Putri",
  "Fajar Ramadhan",
  "Maya Sari",
  "Dimas Anggara",
  "Putra Mahesa",
  "Lestari Dewi",
]
const dummyArticleSlugs = [
  "tips-maksimalkan-chatgpt-plus-untuk-mahasiswa",
  "perbandingan-chatgpt-plus-vs-gemini-pro-2025",
  "cara-aman-berlangganan-akun-ai-sharing",
  "manfaat-api-key-ai-untuk-developer-pemula",
]

async function main() {
  const { prisma } = await import("../src/lib/server/prisma")
  const result = await prisma.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({
      where: { email: "admin@geraiakun.id" },
      select: { id: true },
    })
    const seededProducts = await tx.product.findMany({
      where: { slug: { in: ["chatgpt-plus", "gemini-pro"] } },
      select: { id: true },
    })
    const refunds = await tx.refundCase.deleteMany({
      where: { orderInvoice: { startsWith: "INV-TRX-" } },
    })
    const vaultAccounts = await tx.vaultAccount.deleteMany({
      where: { orderInvoice: { startsWith: "INV-TRX-" } },
    })
    const fulfillmentTasks = await tx.fulfillmentTask.deleteMany({
      where: { invoice: { startsWith: "INV-TRX-" } },
    })
    const tickets = await tx.ticket.deleteMany({ where: { code: { in: dummyTicketCodes } } })
    const paymentAttempts = await tx.paymentAttempt.deleteMany({
      where: { invoice: { startsWith: "INV-TRX-" } },
    })
    const orders = await tx.order.deleteMany({
      where: { invoice: { startsWith: "INV-TRX-" } },
    })
    const resellers = await tx.reseller.deleteMany({ where: { code: "RES-001" } })
    const reviews = await tx.review.deleteMany({ where: { userName: { in: dummyReviewers } } })
    const articles = await tx.article.deleteMany({
      where: { translations: { some: { slug: { in: dummyArticleSlugs } } } },
    })
    const promos = await tx.promo.deleteMany({ where: { code: { in: dummyPromoCodes } } })
    const credentials = await tx.credentialStock.deleteMany({
      where: { id: { startsWith: "cred-seed-" } },
    })
    const wishlists = admin
      ? await tx.wishlist.deleteMany({
          where: {
            userId: admin.id,
            productId: { in: seededProducts.map((product) => product.id) },
          },
        })
      : { count: 0 }

    return {
      refunds: refunds.count,
      vaultAccounts: vaultAccounts.count,
      fulfillmentTasks: fulfillmentTasks.count,
      tickets: tickets.count,
      paymentAttempts: paymentAttempts.count,
      orders: orders.count,
      resellers: resellers.count,
      reviews: reviews.count,
      articles: articles.count,
      promos: promos.count,
      credentials: credentials.count,
      wishlists: wishlists.count,
    }
  })

  console.log(JSON.stringify(result, null, 2))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
