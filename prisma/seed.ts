import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { categories } from "../src/lib/mock/categories"
import { products } from "../src/lib/mock/products"
import { promos } from "../src/lib/mock/transactions"
import { encryptSecret } from "../src/lib/server/crypto"
import { hashPassword } from "../src/lib/server/password"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl || databaseUrl.includes("USER:PASSWORD@HOST")) {
  throw new Error("Set DATABASE_URL to a real Postgres connection string before running db:seed.")
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
})
const prisma = new PrismaClient({ adapter })

const accountType = {
  sharing: "SHARING",
  private: "PRIVATE",
  invite: "INVITE",
  lifetime: "LIFETIME",
} as const

const productBadge = {
  terlaris: "BESTSELLER",
  baru: "NEW",
  promo: "PROMO",
  langka: "RARE",
} as const

const promoType = {
  persen: "PERCENT",
  nominal: "NOMINAL",
} as const

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@geraiakun.id"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "geraiakun-admin"

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      name: "Admin geraiakun",
      email: adminEmail,
      role: "ADMIN",
      passwordHash: await hashPassword(adminPassword),
      profile: { create: { status: "vip" } },
      adminStaff: { create: { status: "active", twoFactorEnabled: false } },
    },
  })
}

async function seedCatalog() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        descriptionEn: category.descriptionEn,
        icon: category.icon,
        color: category.color,
      },
      create: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        descriptionEn: category.descriptionEn,
        icon: category.icon,
        color: category.color,
      },
    })
  }

  for (const product of products) {
    const dbProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        brand: product.brand,
        tagline: product.tagline,
        taglineEn: product.taglineEn,
        description: product.description,
        descriptionEn: product.descriptionEn,
        image: product.image,
        gallery: product.gallery,
        logo: product.logo,
        accent: product.accent,
        badges: product.badges.map((badge) => productBadge[badge]),
        rating: product.rating,
        reviewCount: product.reviewCount,
        soldCount: product.soldCount,
        featured: product.featured,
        features: product.features,
        featuresEn: product.featuresEn,
        faqs: product.faqs,
        category: { connect: { slug: product.category } },
      },
      create: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        tagline: product.tagline,
        taglineEn: product.taglineEn,
        description: product.description,
        descriptionEn: product.descriptionEn,
        image: product.image,
        gallery: product.gallery,
        logo: product.logo,
        accent: product.accent,
        badges: product.badges.map((badge) => productBadge[badge]),
        rating: product.rating,
        reviewCount: product.reviewCount,
        soldCount: product.soldCount,
        featured: product.featured,
        features: product.features,
        featuresEn: product.featuresEn,
        faqs: product.faqs,
        category: { connect: { slug: product.category } },
      },
    })

    for (const variant of product.variants) {
      await prisma.productVariant.upsert({
        where: { id: variant.id },
        update: {
          label: variant.label,
          labelEn: variant.labelEn,
          type: accountType[variant.type],
          durationDays: variant.durationDays,
          price: variant.price,
          originalPrice: variant.originalPrice,
          stock: variant.stock,
        },
        create: {
          id: variant.id,
          productId: dbProduct.id,
          label: variant.label,
          labelEn: variant.labelEn,
          type: accountType[variant.type],
          durationDays: variant.durationDays,
          price: variant.price,
          originalPrice: variant.originalPrice,
          stock: variant.stock,
        },
      })
    }
  }
}

async function seedPromos() {
  for (const promo of promos) {
    await prisma.promo.upsert({
      where: { code: promo.code },
      update: {
        description: promo.description,
        type: promoType[promo.type],
        value: promo.value,
        minSpend: promo.minSpend,
        maxDiscount: promo.maxDiscount,
        used: promo.used,
        quota: promo.quota,
        expiresAt: new Date(`${promo.expiresAt}T23:59:59.000Z`),
        active: promo.active,
        scope: promo.scope,
      },
      create: {
        id: promo.id,
        code: promo.code,
        description: promo.description,
        type: promoType[promo.type],
        value: promo.value,
        minSpend: promo.minSpend,
        maxDiscount: promo.maxDiscount,
        used: promo.used,
        quota: promo.quota,
        expiresAt: new Date(`${promo.expiresAt}T23:59:59.000Z`),
        active: promo.active,
        scope: promo.scope,
      },
    })
  }
}

async function seedCredentialStock() {
  const variants = await prisma.productVariant.findMany({
    include: { product: true },
    take: 12,
  })

  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index]
    await prisma.credentialStock.upsert({
      where: { id: `cred-seed-${index + 1}` },
      update: {},
      create: {
        id: `cred-seed-${index + 1}`,
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.name,
        variantLabel: variant.label,
        loginEmailEncrypted: encryptSecret(`vault${index + 1}@geraiakun.test`) ?? "",
        passwordEncrypted: encryptSecret(`Geraiakun-${index + 1}-secure`) ?? "",
        noteEncrypted: encryptSecret("Seed credential untuk sandbox fulfillment."),
        status: "AVAILABLE",
      },
    })
  }
}

async function main() {
  await seedUsers()
  await seedCatalog()
  await seedPromos()
  await seedCredentialStock()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
