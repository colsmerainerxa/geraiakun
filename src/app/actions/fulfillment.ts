"use server"

import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

export async function deliverFulfillmentCredential(taskId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) {
    throw new Error("DATABASE_NOT_CONFIGURED")
  }

  return prisma.$transaction(async (tx) => {
    const task = await tx.fulfillmentTask.findUnique({
      where: { id: taskId },
      include: {
        order: true,
        product: true,
        variantRef: true,
      },
    })
    if (!task) throw new Error("Fulfillment tidak ditemukan.")
    if (task.status === "SENT") return { ok: true, invoice: task.invoice }

    const credential = await tx.credentialStock.findFirst({
      where: {
        productId: task.productId,
        variantId: task.variantId,
        status: "AVAILABLE",
      },
      orderBy: { addedAt: "asc" },
    })
    if (!credential) throw new Error("Stok credential belum tersedia.")

    const durationDays = task.variantRef.durationDays ?? 365
    const expiresAt = addDays(durationDays)

    await tx.vaultAccount.create({
      data: {
        userId: task.order.userId,
        orderId: task.orderId,
        orderInvoice: task.invoice,
        productId: task.productId,
        productSlug: task.product.slug,
        variantId: task.variantId,
        productName: task.productName,
        plan: task.variant,
        loginEmailEncrypted: credential.loginEmailEncrypted,
        passwordEncrypted: credential.passwordEncrypted,
        pinEncrypted: credential.pinEncrypted,
        noteEncrypted: credential.noteEncrypted,
        status: "ACTIVE",
        expiresAt,
        warrantyUntil: expiresAt,
        reorderPrice: task.variantRef.price,
        credentialStockId: credential.id,
      },
    })

    await tx.credentialStock.update({
      where: { id: credential.id },
      data: { status: "SOLD", soldAt: new Date() },
    })

    await tx.fulfillmentTask.update({
      where: { id: task.id },
      data: { status: "SENT", slaMinutes: 0 },
    })

    const remaining = await tx.fulfillmentTask.count({
      where: { orderId: task.orderId, status: { not: "SENT" } },
    })
    if (remaining === 0) {
      await tx.order.update({
        where: { id: task.orderId },
        data: { status: "COMPLETED" },
      })
    }

    await tx.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.email ?? "Admin geraiakun",
        action: "fulfillment.deliver",
        module: "fulfillment",
        targetId: task.invoice,
        targetLabel: `${task.productName} - ${credential.id}`,
        outcome: "success",
        detail: `Credential ${credential.id} dikirim ke vault pelanggan.`,
      },
    })

    return { ok: true, invoice: task.invoice }
  })
}
