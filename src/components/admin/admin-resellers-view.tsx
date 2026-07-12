"use client"

import {
  Building2,
  CheckCircle2,
  Search,
  ShieldCheck,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { StatCard } from "@/components/admin/parts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQueryClient } from "@tanstack/react-query"
import { useAdminResellers } from "@/lib/api/queries"
import { cn, formatDate, formatIDR } from "@/lib/utils"
import type { ResellerVerificationStatus } from "@/types"

const RESELLER_PLANS = [
  { id: "starter", name: "Starter Reseller", discount: "8%" },
  { id: "pro", name: "Pro Agency", discount: "15%" },
  { id: "enterprise", name: "Enterprise Partner", discount: "Custom" },
] as const

const STATUS_META: Record<
  ResellerVerificationStatus,
  { label: string; variant: "neutral" | "warning" | "success" | "danger" }
> = {
  draft: { label: "Draft", variant: "neutral" },
  review: { label: "Perlu Review", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  rejected: { label: "Ditolak", variant: "danger" },
}

export function AdminResellersView() {
  const queryClient = useQueryClient()
  const { data: resellersData } = useAdminResellers()
  const resellers = (resellersData ?? []) as any[]
  // ponytail: no API for ledger/bulkOrders yet; add when endpoints exist
  const ledger = [] as any[]
  const bulkOrders = [] as any[]
  const updateReseller = async (id: string, patch: Record<string, unknown>) => {
    await fetch("/api/admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    })
    queryClient.invalidateQueries({ queryKey: ["admin", "resellers"] })
  }
  const adjustBalance = async (id: string, amount: number, note: string) => {
    await fetch("/api/admin/resellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, balanceAdjustment: amount, note }),
    })
    queryClient.invalidateQueries({ queryKey: ["admin", "resellers"] })
  }
  const [selectedId, setSelectedId] = useState(resellers[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [balanceOpen, setBalanceOpen] = useState(false)
  const [balanceAmount, setBalanceAmount] = useState("")
  const [balanceNote, setBalanceNote] = useState("")
  const selected = resellers.find((item) => item.id === selectedId) ?? resellers[0]

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    if (!needle) return resellers
    return resellers.filter((item) =>
      [item.companyName, item.ownerName, item.email].join(" ").toLowerCase().includes(needle),
    )
  }, [query, resellers])
  const totalBalance = resellers.reduce((sum, item) => sum + item.balance, 0)
  const selectedLedger = ledger.filter((entry) => entry.resellerId === selected?.id)
  const selectedOrders = bulkOrders.filter((order) => order.resellerId === selected?.id)

  function saveBalance() {
    if (!selected) return
    const amount = Number(balanceAmount)
    if (!Number.isFinite(amount) || amount === 0 || balanceNote.trim().length < 3) {
      toast.error("Isi nominal dan alasan penyesuaian")
      return
    }
    adjustBalance(selected.id, amount, balanceNote.trim())
    setBalanceOpen(false)
    setBalanceAmount("")
    setBalanceNote("")
    toast.success("Saldo reseller diperbarui")
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Partner"
          value={resellers.length}
          icon={UsersRound}
          accent="bg-accent-cyan"
        />
        <StatCard
          label="Verified"
          value={resellers.filter((item) => item.verificationStatus === "verified").length}
          icon={ShieldCheck}
          accent="bg-accent-lime"
        />
        <StatCard
          label="Perlu Review"
          value={resellers.filter((item) => item.verificationStatus === "review").length}
          icon={Building2}
          accent="bg-warning"
        />
        <StatCard
          label="Saldo Tersimpan"
          value={formatIDR(totalBalance, { compact: true })}
          icon={WalletCards}
          accent="bg-accent-purple"
        />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="min-w-0">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari perusahaan atau owner..."
              className="pl-9"
            />
          </div>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow-sm brutal-press",
                  selected?.id === item.id && "ring-4 ring-main/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-extrabold">
                      {item.companyName}
                    </p>
                    <p className="truncate text-xs text-foreground/55">{item.ownerName}</p>
                  </div>
                  <Badge variant={STATUS_META[item.verificationStatus as ResellerVerificationStatus].variant}>
                    {STATUS_META[item.verificationStatus as ResellerVerificationStatus].label}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t-2 border-dashed border-border pt-3">
                  <div>
                    <p className="text-xs font-bold text-foreground/60">Saldo</p>
                    <p className="font-heading font-extrabold">{formatIDR(item.balance)}</p>
                  </div>
                  <span className="rounded-base border-2 border-border bg-main px-2 py-1 text-xs font-bold">
                    {RESELLER_PLANS.find((plan) => plan.id === item.tierId)?.name ?? item.tierId}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <section className="min-w-0 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-border bg-main p-6">
              <div>
                <Badge variant={STATUS_META[selected.verificationStatus as ResellerVerificationStatus].variant}>
                  {STATUS_META[selected.verificationStatus as ResellerVerificationStatus].label}
                </Badge>
                <h2 className="mt-2 font-heading text-xl font-extrabold">{selected.companyName}</h2>
                <p className="text-sm font-bold text-main-foreground/65">
                  {selected.ownerName} - {selected.email}
                </p>
              </div>
              <Button variant="neutral" onClick={() => setBalanceOpen(true)}>
                <WalletCards className="size-4" /> Adjust Saldo
              </Button>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h3 className="font-heading text-sm font-extrabold">Profil dan akses</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  {[
                    ["WhatsApp", selected.whatsapp],
                    ["Bergabung", formatDate(selected.joinedAt)],
                    ["Team seats", String(selected.teamSeats)],
                    ["Saldo", formatIDR(selected.balance)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-base border-2 border-border bg-background p-3"
                    >
                      <dt className="text-xs font-bold text-foreground/60">{label}</dt>
                      <dd className="mt-1 font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Tier harga</Label>
                    <Select
                      value={selected.tierId}
                      onValueChange={(tierId) => {
                        updateReseller(selected.id, { tierId })
                        toast.success("Tier reseller diperbarui")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESELLER_PLANS.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.discount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selected.verificationStatus === "review" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() =>
                          updateReseller(selected.id, { verificationStatus: "verified" })
                        }
                      >
                        <CheckCircle2 className="size-4" /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          updateReseller(selected.id, { verificationStatus: "rejected" })
                        }
                      >
                        <XCircle className="size-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-heading text-sm font-extrabold">Ledger saldo</h3>
                <div className="mt-3 overflow-hidden rounded-base border-2 border-border bg-background">
                  {selectedLedger.length ? (
                    selectedLedger.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-3 border-b-2 border-border p-3 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-bold">{entry.note}</p>
                          <p className="text-xs text-foreground/60">
                            {formatDate(entry.createdAt)} - {entry.kind}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "font-heading text-sm font-extrabold",
                              entry.amount >= 0 ? "text-success" : "text-danger",
                            )}
                          >
                            {entry.amount >= 0 ? "+" : ""}
                            {formatIDR(entry.amount)}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {formatIDR(entry.balanceAfter)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-6 text-center text-sm text-foreground/60">Belum ada ledger.</p>
                  )}
                </div>
                <h3 className="mt-5 font-heading text-sm font-extrabold">Bulk order</h3>
                <div className="mt-3 grid gap-2">
                  {selectedOrders.length ? (
                    selectedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-base border-2 border-border bg-background p-3"
                      >
                        <div>
                          <p className="font-heading text-sm font-bold">{order.id}</p>
                          <p className="text-xs text-foreground/60">
                            {order.lines.length} baris - {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="cyan">{order.status}</Badge>
                          <p className="mt-1 text-xs font-bold">{formatIDR(order.total)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-foreground/60">Belum ada bulk order.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Penyesuaian Saldo</DialogTitle>
            <DialogDescription>
              Gunakan nilai positif untuk menambah dan negatif untuk mengurangi saldo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="balance-amount">Nominal</Label>
              <Input
                id="balance-amount"
                type="number"
                value={balanceAmount}
                onChange={(event) => setBalanceAmount(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="balance-note">Alasan</Label>
              <Input
                id="balance-note"
                value={balanceNote}
                onChange={(event) => setBalanceNote(event.target.value)}
                placeholder="Contoh: koreksi top up"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setBalanceOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveBalance}>Simpan Penyesuaian</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
