import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { encryptSecret } from "@/lib/server/crypto"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"

const postSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  loginEmail: z.string().min(1),
  loginPassword: z.string().min(1),
})

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const url = new URL(request.url)
  const productId = url.searchParams.get("productId") ?? undefined
  const variantId = url.searchParams.get("variantId") ?? undefined
  const status = url.searchParams.get("status") ?? undefined

  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId
  if (variantId) where.variantId = variantId
  if (status) where.status = status

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

  return NextResponse.json(credentials)
}

export async function POST(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = postSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { productId, variantId, loginEmail, loginPassword } = parsed.data

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  })
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  let variantLabel = ""
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, label: true },
    })
    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }
    variantLabel = variant.label
  }

  const cred = await prisma.credentialStock.create({
    data: {
      productId,
      variantId: variantId ?? null,
      productName: product.name,
      variantLabel,
      loginEmailEncrypted: encryptSecret(loginEmail) ?? "",
      passwordEncrypted: encryptSecret(loginPassword) ?? "",
      status: "AVAILABLE",
    },
  })

  if (variantId) {
    const count = await prisma.credentialStock.count({
      where: { variantId, status: "AVAILABLE" },
    })
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: count },
    })
  }

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "credential.create",
      module: "credential",
      targetId: cred.id,
      targetLabel: `${product.name} - ${cred.id}`,
      outcome: "success",
      detail: `Credential ${cred.id} ditambahkan ke stok.`,
    },
  })

  return NextResponse.json(cred)
}

export async function DELETE(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 })
  }

  const cred = await prisma.credentialStock.findUnique({ where: { id } })
  if (!cred) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 })
  }
  if (cred.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Credential is not available for deletion" }, { status: 400 })
  }

  await prisma.credentialStock.delete({ where: { id } })

  if (cred.variantId) {
    const count = await prisma.credentialStock.count({
      where: { variantId: cred.variantId, status: "AVAILABLE" },
    })
    await prisma.productVariant.update({
      where: { id: cred.variantId },
      data: { stock: count },
    })
  }

  await prisma.auditEvent.create({
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

  return NextResponse.json({ success: true, id })
}
