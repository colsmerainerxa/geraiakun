import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { categories } from "../src/lib/mock/categories"
import { products } from "../src/lib/mock/products"
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

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@geraiakun.id"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "geraiakun-admin-2026"

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", emailVerified: new Date() },
    create: {
      name: "Admin geraiakun",
      email: adminEmail,
      emailVerified: new Date(),
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

async function main() {
  await seedUsers()
  await seedCatalog()
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
