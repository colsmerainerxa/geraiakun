"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { encryptSecret } from "@/lib/server/crypto"
import type { Prisma } from "@/generated/prisma/client"

const bulkImportSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    loginEmail: z.string().min(1).max(500),
    password: z.string().min(1).max(500),
    pin: z.string().max(100).optional(),
    note: z.string().max(2000).optional(),
  })).min(1).max(1000),
})
const idSchema = z.string().min(1)
const assignSchema = z.object({
  taskId: z.string().min(1),
  credentialId: z.string().min(1),
})

type CredentialStatus = "AVAILABLE" | "SOLD" | "EXPIRED" | "HELD"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  return session
}

async function syncVariantStock(tx: Prisma.TransactionClient, variantId: string | null) {
  if (!variantId) return
  const count = await tx.credentialStock.count({
    where: { variantId, status: "AVAILABLE" },
  })
  await tx.productVariant.update({ where: { id: variantId }, data: { stock: count } })
}

export async function bulkImportCredentials(input: z.infer<typeof bulkImportSchema>) {
  const parsed = bulkImportSchema.safeParse(input)
  if (!parsed.success) throw new Error("INVALID_INPUT")
  const session = await requireAdmin()
  if (!parsed.data.items?.length) throw new Error("ITEMS_REQUIRED")
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const created = await prisma.$transaction(async (tx) => {
    const results: { id: string }[] = []

    for (const item of parsed.data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true },
      })
      if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`)

      let variantLabel = ""
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, label: true },
        })
        if (!variant) throw new Error(`VARIANT_NOT_FOUND:${item.variantId}`)
        variantLabel = variant.label
      }

      const cred = await tx.credentialStock.create({
        data: {
          productId: item.productId,
          variantId: item.variantId ?? null,
          productName: product.name,
          variantLabel,
          loginEmailEncrypted: encryptSecret(item.loginEmail) ?? "",
          passwordEncrypted: encryptSecret(item.password) ?? "",
          pinEncrypted: encryptSecret(item.pin),
          noteEncrypted: encryptSecret(item.note),
          status: "AVAILABLE",
        },
      })
      results.push({ id: cred.id })
    }

    // Sync stock for all distinct variants touched
    const variantIds = [...new Set(parsed.data.items.map((i) => i.variantId).filter(Boolean))] as string[]
    for (const vid of variantIds) {
      await syncVariantStock(tx, vid)
    }

    await tx.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.email ?? "Admin",
        action: "credential.bulk_import",
        module: "credential",
        targetId: variantIds[0] ?? parsed.data.items[0].productId,
        targetLabel: `${results.length} credentials`,
        outcome: "success",
        detail: `Bulk import ${results.length} credentials untuk ${variantIds.length} varian.`,
      },
    })

    return results
  })

  return { ok: true, count: created.length }
}

export async function deleteCredential(rawId: string) {
  const id = idSchema.parse(rawId)
  const session = await requireAdmin()
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  return prisma.$transaction(async (tx) => {
    const cred = await tx.credentialStock.findUnique({ where: { id } })
    if (!cred) throw new Error("CREDENTIAL_NOT_FOUND")
    if (cred.status !== "AVAILABLE") throw new Error("CREDENTIAL_NOT_AVAILABLE")

    await tx.credentialStock.delete({ where: { id } })
    await syncVariantStock(tx, cred.variantId)

    await tx.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.email ?? "Admin",
        action: "credential.delete",
        module: "credential",
        targetId: id,
        targetLabel: `${cred.productName} - ${cred.id}`,
        outcome: "success",
        detail: `Credential ${id} dihapus dari stok.`,
      },
    })

    return { ok: true }
  })
}

export async function assignCredentialToTask(rawTaskId: string, rawCredentialId: string) {
  const { taskId, credentialId } = assignSchema.parse({ taskId: rawTaskId, credentialId: rawCredentialId })
  const session = await requireAdmin()
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  return prisma.$transaction(async (tx) => {
    const [task, credential] = await Promise.all([
      tx.fulfillmentTask.findUnique({ where: { id: taskId } }),
      tx.credentialStock.findUnique({ where: { id: credentialId } }),
    ])
    if (!task) throw new Error("TASK_NOT_FOUND")
    if (!credential) throw new Error("CREDENTIAL_NOT_FOUND")
    if (credential.status !== "AVAILABLE") throw new Error("CREDENTIAL_NOT_AVAILABLE")
    if (credential.productId !== task.productId || credential.variantId !== task.variantId) {
      throw new Error("CREDENTIAL_PRODUCT_MISMATCH")
    }

    // Mark credential as HELD and update task status to READY_TO_SEND
    await tx.credentialStock.update({
      where: { id: credentialId },
      data: { status: "HELD" },
    })

    await tx.fulfillmentTask.update({
      where: { id: taskId },
      data: { status: "READY_TO_SEND" },
    })

    await syncVariantStock(tx, credential.variantId)

    await tx.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.email ?? "Admin",
        action: "credential.assign",
        module: "credential",
        targetId: taskId,
        targetLabel: `${task.invoice} - ${credentialId}`,
        outcome: "success",
        detail: `Credential ${credentialId} ditugaskan ke fulfillment ${task.invoice}.`,
      },
    })

    return { ok: true }
  })
}

export async function listCredentials(filters: {
  productId?: string
  variantId?: string
  status?: CredentialStatus
}) {
  const session = await requireAdmin()
  if (!backendFlags.databaseConfigured) return []

  const where: Prisma.CredentialStockWhereInput = {}
  if (filters.productId) where.productId = filters.productId
  if (filters.variantId) where.variantId = filters.variantId
  if (filters.status) where.status = filters.status

  const credentials = await prisma.credentialStock.findMany({
    where,
    orderBy: { addedAt: "desc" },
    select: {
      id: true,
      productId: true,
      variantId: true,
      productName: true,
      variantLabel: true,
      status: true,
      addedAt: true,
      soldAt: true,
    },
  })

  return credentials
}
