import { prisma } from "@/lib/server/prisma";

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@geraiakun.id" },
    select: { id: true, name: true, email: true },
  });
  if (!admin) throw new Error("Admin user not found. Run seed.ts first.");

  const products = await prisma.product.findMany({
    where: { slug: { in: ["chatgpt-plus", "gemini-pro", "api-key"] } },
    include: { variants: true },
  });
  if (products.length < 3) throw new Error("Need 3 products. Run seed.ts first.");

  const [p1, p2, p3] = products;
  const v1 = p1.variants[0];
  const v2 = p2.variants[0];
  const v3 = p3.variants[0];
  if (!v1 || !v2 || !v3) throw new Error("Products missing variants.");

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
  const daysAhead = (d: number) => new Date(now.getTime() + d * 86_400_000);

  // ── Orders ──
  const orderDefs = [
    { invoice: "INV-TRX-001", status: "COMPLETED" as const, paidAt: daysAgo(3), method: "QRIS" as const, product: p1, variant: v1, qty: 1 },
    { invoice: "INV-TRX-002", status: "PROCESSING" as const, paidAt: null, method: "GOPAY" as const, product: p2, variant: v2, qty: 1 },
    { invoice: "INV-TRX-003", status: "WAITING_PAYMENT" as const, paidAt: null, method: "DANA" as const, product: p1, variant: v1, qty: 2 },
    { invoice: "INV-TRX-004", status: "COMPLETED" as const, paidAt: daysAgo(1), method: "BCA_VA" as const, product: p3, variant: v3, qty: 1 },
    { invoice: "INV-TRX-005", status: "CANCELLED" as const, paidAt: null, method: "OVO" as const, product: p2, variant: v2, qty: 1 },
  ];

  const orderIds: Record<string, string> = {};

  for (const def of orderDefs) {
    const subtotal = def.variant.price * def.qty;
    const fee = def.method === "QRIS" ? Math.round(subtotal * 0.007) : 0;
    const total = subtotal + fee;

    const existing = await prisma.order.findUnique({ where: { invoice: def.invoice } });

    if (existing) {
      orderIds[def.invoice] = existing.id;
      continue;
    }

    const order = await prisma.order.create({
      data: {
        invoice: def.invoice,
        userId: admin.id,
        customerName: admin.name ?? "Admin",
        customerEmail: admin.email!,
        whatsapp: "081234567890",
        subtotal,
        fee,
        total,
        status: def.status,
        paymentMethod: def.method,
        paidAt: def.paidAt,
        items: {
          create: {
            productId: def.product.id,
            variantId: def.variant.id,
            productName: def.product.name,
            productLogo: def.product.logo,
            variantLabel: def.variant.label,
            price: def.variant.price,
            qty: def.qty,
          },
        },
      },
    });
    orderIds[def.invoice] = order.id;
  }

  // ── Payment Attempts (for orders 1, 2, 3) ──
  const paymentDefs = [
    { invoice: "INV-TRX-001", orderId: orderIds["INV-TRX-001"], status: "PAID" as const, method: "QRIS" as const, amount: 0, midtransId: "TRX-001-MID" },
    { invoice: "INV-TRX-002", orderId: orderIds["INV-TRX-002"], status: "CHECKING" as const, method: "GOPAY" as const, amount: 0, midtransId: "TRX-002-MID" },
    { invoice: "INV-TRX-003", orderId: orderIds["INV-TRX-003"], status: "PENDING" as const, method: "DANA" as const, amount: 0, midtransId: "TRX-003-MID" },
  ];

  for (const pd of paymentDefs) {
    const existing = await prisma.paymentAttempt.findUnique({ where: { midtransOrderId: pd.midtransId } });
    if (existing) continue;

    const order = await prisma.order.findUnique({ where: { id: pd.orderId } });
    if (!order) continue;

    await prisma.paymentAttempt.create({
      data: {
        invoice: pd.invoice,
        orderId: pd.orderId,
        method: pd.method,
        status: pd.status,
        amount: order.total,
        paymentCode: `PAY-${pd.invoice}`,
        midtransOrderId: pd.midtransId,
        expiresAt: daysAhead(1),
      },
    });
  }

  // ── Vault Accounts (for the 2 completed orders) ──
  const vaultDefs = [
    { orderInvoice: "INV-TRX-001", product: p1, variant: v1, loginEmail: "user001@geraiakun.id" },
    { orderInvoice: "INV-TRX-004", product: p3, variant: v3, loginEmail: "user004@geraiakun.id" },
  ];

  for (const vd of vaultDefs) {
    const orderId = orderIds[vd.orderInvoice];
    if (!orderId) continue;

    const existing = await prisma.vaultAccount.findFirst({ where: { orderId } });
    if (existing) continue;

    await prisma.vaultAccount.create({
      data: {
        userId: admin.id,
        orderId,
        orderInvoice: vd.orderInvoice,
        productId: vd.product.id,
        productSlug: vd.product.slug,
        variantId: vd.variant.id,
        productName: vd.product.name,
        plan: vd.variant.label,
        loginEmailEncrypted: vd.loginEmail,
        passwordEncrypted: "encrypted-password-placeholder",
        status: "ACTIVE",
        warrantyUntil: daysAhead(30),
        reorderPrice: Math.round(vd.variant.price * 0.8),
      },
    });
  }

  // ── Tickets ──
  const ticketDefs = [
    {
      code: "TKT-001", type: "WARRANTY" as const, subject: "Akun tidak bisa login",
      description: "Saya tidak bisa login ke akun yang baru dibeli.", status: "NEW" as const,
      priority: "HIGH" as const, invoice: "INV-TRX-001", product: p1,
      messages: [
        { from: "customer", text: "Akun tidak bisa login, mohon bantuan.", at: daysAgo(2).toISOString() },
      ],
    },
    {
      code: "TKT-002", type: "PAYMENT" as const, subject: "Pembayaran belum terkonfirmasi",
      description: "Sudah bayar tapi status masih waiting.", status: "PROCESSING" as const,
      priority: "NORMAL" as const, invoice: "INV-TRX-002", product: p2,
      messages: [
        { from: "customer", text: "Saya sudah bayar 1 jam lalu.", at: daysAgo(1).toISOString() },
        { from: "admin", text: "Sedang kami cek, mohon ditunggu.", at: daysAgo(1).toISOString() },
      ],
    },
    {
      code: "TKT-003", type: "ACCOUNT" as const, subject: "Ganti email akun",
      description: "Mohon ganti email akun saya.", status: "DONE" as const,
      priority: "LOW" as const, invoice: null, product: p3,
      messages: [
        { from: "customer", text: "Bisa request ganti email?", at: daysAgo(5).toISOString() },
        { from: "admin", text: "Sudah diganti, silakan cek.", at: daysAgo(4).toISOString() },
        { from: "customer", text: "Sudah, terima kasih.", at: daysAgo(4).toISOString() },
      ],
    },
  ];

  for (const td of ticketDefs) {
    const existing = await prisma.ticket.findUnique({ where: { code: td.code } });
    if (existing) continue;

    await prisma.ticket.create({
      data: {
        code: td.code,
        userId: admin.id,
        type: td.type,
        subject: td.subject,
        description: td.description,
        invoice: td.invoice,
        productId: td.product.id,
        productName: td.product.name,
        priority: td.priority,
        status: td.status,
        customerName: admin.name ?? "Admin",
        customerEmail: admin.email!,
        whatsapp: "081234567890",
        messages: td.messages,
      },
    });
  }

  // ── Refund Cases ──
  const refundDefs = [
    {
      orderInvoice: "INV-TRX-001", product: p1, reason: "Akun tidak sesuai deskripsi",
      amount: v1.price, status: "REVIEW" as const,
      timeline: [
        { action: "created", at: daysAgo(2).toISOString(), by: "customer" },
        { action: "review_started", at: daysAgo(1).toISOString(), by: "admin" },
      ],
    },
    {
      orderInvoice: "INV-TRX-005", product: p2, reason: "Cancel order, refund requested",
      amount: v2.price, status: "CLOSED" as const,
      timeline: [
        { action: "created", at: daysAgo(4).toISOString(), by: "customer" },
        { action: "refund_processed", at: daysAgo(3).toISOString(), by: "admin" },
        { action: "closed", at: daysAgo(3).toISOString(), by: "admin" },
      ],
    },
  ];

  for (const rd of refundDefs) {
    const orderId = orderIds[rd.orderInvoice];
    const existing = await prisma.refundCase.findFirst({ where: { orderInvoice: rd.orderInvoice } });
    if (existing) continue;

    await prisma.refundCase.create({
      data: {
        userId: admin.id,
        orderId: orderId ?? null,
        orderInvoice: rd.orderInvoice,
        productId: rd.product.id,
        productName: rd.product.name,
        reason: rd.reason,
        amount: rd.amount,
        status: rd.status,
        owner: "CS geraiakun",
        evidence: [],
        timeline: rd.timeline,
      },
    });
  }

  // ── Reseller ──
  const existingReseller = await prisma.reseller.findUnique({ where: { code: "RES-001" } });
  if (!existingReseller) {
    await prisma.reseller.create({
      data: {
        userId: admin.id,
        code: "RES-001",
        tier: "gold",
        commission: 15,
        balance: 50000,
        totalSales: 500000,
        active: true,
      },
    });
  }

  // ── Wishlist ──
  for (const product of [p1, p2]) {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: admin.id, productId: product.id } },
    });
    if (!existing) {
      await prisma.wishlist.create({
        data: { userId: admin.id, productId: product.id },
      });
    }
  }

  // ── Summary ──
  const [orders, payments, vaults, tickets, refunds, resellers, wishlists] = await Promise.all([
    prisma.order.count({ where: { invoice: { startsWith: "INV-TRX-" } } }),
    prisma.paymentAttempt.count({ where: { midtransOrderId: { startsWith: "TRX-" } } }),
    prisma.vaultAccount.count({ where: { orderInvoice: { startsWith: "INV-TRX-" } } }),
    prisma.ticket.count({ where: { code: { startsWith: "TKT-" } } }),
    prisma.refundCase.count({ where: { orderInvoice: { startsWith: "INV-TRX-" } } }),
    prisma.reseller.count({ where: { code: "RES-001" } }),
    prisma.wishlist.count({ where: { userId: admin.id } }),
  ]);

  console.log("── Transactional seed complete ──");
  console.log(`  Orders:          ${orders}`);
  console.log(`  Payment attempts:${payments}`);
  console.log(`  Vault accounts:  ${vaults}`);
  console.log(`  Tickets:         ${tickets}`);
  console.log(`  Refund cases:    ${refunds}`);
  console.log(`  Resellers:       ${resellers}`);
  console.log(`  Wishlist:        ${wishlists}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
