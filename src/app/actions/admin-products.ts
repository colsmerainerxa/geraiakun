"use server"

import { randomUUID } from "node:crypto"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

// --- Schemas ---

const productSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(1),
  brand: z.string().min(1),
  tagline: z.string().min(1),
  taglineEn: z.string().min(1),
  description: z.string().min(1),
  descriptionEn: z.string().min(1),
  image: z.string().default(""),
  logo: z.string().default(""),
  accent: z.string().default("#000000"),
  categoryId: z.string().min(1),
  badges: z.array(z.enum(["BESTSELLER", "NEW", "PROMO", "RARE"])).default([]),
  features: z.array(z.string()).default([]),
  featuresEn: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  faqs: z.any().default([]),
})

const variantSchema = z.object({
  productId: z.string().min(1),
  label: z.string().min(1),
  labelEn: z.string().min(1),
  type: z.enum(["SHARING", "PRIVATE", "INVITE", "LIFETIME"]),
  durationDays: z.number().int().nullable().optional(),
  price: z.number().int().min(0),
  originalPrice: z.number().int().nullable().optional(),
  stock: z.number().int().min(0).default(0),
})

const categorySchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().min(1),
  descriptionEn: z.string().min(1),
  icon: z.string().default(""),
  color: z.string().default("#000000"),
})

// --- Products ---

export async function createProduct(input: z.input<typeof productSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data produk tidak valid.")

  const product = await prisma.product.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      brand: parsed.data.brand,
      tagline: parsed.data.tagline,
      taglineEn: parsed.data.taglineEn,
      description: parsed.data.description,
      descriptionEn: parsed.data.descriptionEn,
      image: parsed.data.image,
      logo: parsed.data.logo,
      accent: parsed.data.accent,
      categoryId: parsed.data.categoryId,
      badges: parsed.data.badges,
      features: parsed.data.features,
      featuresEn: parsed.data.featuresEn,
      featured: parsed.data.featured,
      faqs: parsed.data.faqs,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "product.create",
      module: "produk",
      targetId: product.id,
      targetLabel: product.name,
      outcome: "success",
      detail: `Produk ${product.name} dibuat.`,
    },
  })

  return { ok: true, id: product.id }
}

export async function updateProduct(id: string, input: z.input<typeof productSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data produk tidak valid.")

  const product = await prisma.product.update({
    where: { id },
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      brand: parsed.data.brand,
      tagline: parsed.data.tagline,
      taglineEn: parsed.data.taglineEn,
      description: parsed.data.description,
      descriptionEn: parsed.data.descriptionEn,
      image: parsed.data.image,
      logo: parsed.data.logo,
      accent: parsed.data.accent,
      categoryId: parsed.data.categoryId,
      badges: parsed.data.badges,
      features: parsed.data.features,
      featuresEn: parsed.data.featuresEn,
      featured: parsed.data.featured,
      faqs: parsed.data.faqs,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "product.update",
      module: "produk",
      targetId: product.id,
      targetLabel: product.name,
      outcome: "success",
      detail: `Produk ${product.name} diperbarui.`,
    },
  })

  return { ok: true }
}

export async function deleteProduct(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const product = await prisma.product.update({
    where: { id },
    data: { active: false },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "product.delete",
      module: "produk",
      targetId: id,
      targetLabel: product.name,
      outcome: "success",
      detail: `Produk ${product.name} dinonaktifkan.`,
    },
  })

  return { ok: true }
}

// --- Variants ---

export async function createVariant(input: z.input<typeof variantSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const parsed = variantSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data varian tidak valid.")

  const variant = await prisma.productVariant.create({
    data: {
      id: randomUUID(),
      productId: parsed.data.productId,
      label: parsed.data.label,
      labelEn: parsed.data.labelEn,
      type: parsed.data.type,
      durationDays: parsed.data.durationDays,
      price: parsed.data.price,
      originalPrice: parsed.data.originalPrice,
      stock: parsed.data.stock,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "variant.create",
      module: "produk",
      targetId: variant.id,
      targetLabel: variant.label,
      outcome: "success",
      detail: `Varian ${variant.label} dibuat.`,
    },
  })

  return { ok: true, id: variant.id }
}

export async function updateVariant(id: string, input: z.input<typeof variantSchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const parsed = variantSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data varian tidak valid.")

  const variant = await prisma.productVariant.update({
    where: { id },
    data: {
      productId: parsed.data.productId,
      label: parsed.data.label,
      labelEn: parsed.data.labelEn,
      type: parsed.data.type,
      durationDays: parsed.data.durationDays,
      price: parsed.data.price,
      originalPrice: parsed.data.originalPrice,
      stock: parsed.data.stock,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "variant.update",
      module: "produk",
      targetId: variant.id,
      targetLabel: variant.label,
      outcome: "success",
      detail: `Varian ${variant.label} diperbarui.`,
    },
  })

  return { ok: true }
}

export async function deleteVariant(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const orderItemCount = await prisma.orderItem.count({
    where: { variantId: id },
  })
  if (orderItemCount > 0) {
    throw new Error("Varian tidak dapat dihapus karena masih memiliki order item.")
  }

  const variant = await prisma.productVariant.delete({ where: { id } })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "variant.delete",
      module: "produk",
      targetId: id,
      targetLabel: variant.label,
      outcome: "success",
      detail: `Varian ${variant.label} dihapus.`,
    },
  })

  return { ok: true }
}

// --- Categories ---

export async function createCategory(input: z.input<typeof categorySchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) throw new Error("Data kategori tidak valid.")

  const category = await prisma.category.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn,
      description: parsed.data.description,
      descriptionEn: parsed.data.descriptionEn,
      icon: parsed.data.icon,
      color: parsed.data.color,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "category.create",
      module: "kategori",
      targetId: category.id,
      targetLabel: category.name,
      outcome: "success",
      detail: `Kategori ${category.name} dibuat.`,
    },
  })

  return { ok: true, id: category.id }
}

export async function updateCategory(id: string, input: z.input<typeof categorySchema>) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) throw new Error("Data kategori tidak valid.")

  const category = await prisma.category.update({
    where: { id },
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn,
      description: parsed.data.description,
      descriptionEn: parsed.data.descriptionEn,
      icon: parsed.data.icon,
      color: parsed.data.color,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "category.update",
      module: "kategori",
      targetId: category.id,
      targetLabel: category.name,
      outcome: "success",
      detail: `Kategori ${category.name} diperbarui.`,
    },
  })

  return { ok: true }
}

export async function deleteCategory(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const productCount = await prisma.product.count({
    where: { categoryId: id },
  })
  if (productCount > 0) {
    throw new Error("Kategori tidak dapat dihapus karena masih memiliki produk.")
  }

  const category = await prisma.category.delete({ where: { id } })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "category.delete",
      module: "kategori",
      targetId: id,
      targetLabel: category.name,
      outcome: "success",
      detail: `Kategori ${category.name} dihapus.`,
    },
  })

  return { ok: true }
}
