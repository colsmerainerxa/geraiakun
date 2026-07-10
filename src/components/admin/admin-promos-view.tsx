"use client"

import { CalendarClock, Pencil, Plus, Search, Ticket, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatDate, formatIDR } from "@/lib/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAdminPromos } from "@/lib/api/queries"
import { createPromo, updatePromo, deletePromo } from "@/app/actions/admin-promos"
import type { Promo, PromoType } from "@/types"

function emptyPromo(): Promo {
  return {
    id: `promo-local-${Date.now()}`,
    code: "",
    description: "",
    type: "persen",
    value: 10,
    minSpend: 0,
    maxDiscount: null,
    used: 0,
    quota: 100,
    expiresAt: "2026-12-31",
    active: true,
    scope: "all",
  }
}

export function AdminPromosView() {
  const { data: promos = [] } = useAdminPromos()
  const queryClient = useQueryClient()
  const saveMutation = useMutation({
    mutationFn: async (promo: any) => {
      const input = {
        code: promo.code,
        description: promo.description,
        type: (promo.type === "persen" ? "PERCENT" : "NOMINAL") as "PERCENT" | "NOMINAL",
        value: promo.value,
        minSpend: promo.minSpend ?? 0,
        maxDiscount: promo.maxDiscount,
        quota: promo.quota,
        expiresAt: promo.expiresAt,
        active: promo.active,
        scope: promo.scope,
      } as any
      if (promo.id && !promo.id.startsWith("promo-local-")) {
        return updatePromo(promo.id, input)
      }
      return createPromo(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promos"] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promos"] })
    },
  })
  const savePromo = (promo: any) => saveMutation.mutate(promo)
  const removePromo = (id: string) => deleteMutation.mutate(id)
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<Promo | null>(null)
  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    if (!needle) return promos
    return promos.filter((promo: any) =>
      [promo.code, promo.description, promo.scope].join(" ").toLowerCase().includes(needle),
    )
  }, [promos, query])

  function patch(patchValue: Partial<Promo>) {
    setDraft((current) => (current ? { ...current, ...patchValue } : current))
  }

  function save() {
    if (!draft) return
    const code = draft.code
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
    if (
      code.length < 4 ||
      draft.description.trim().length < 5 ||
      draft.value <= 0 ||
      draft.quota < 1 ||
      !draft.expiresAt
    ) {
      toast.error("Lengkapi kode, deskripsi, nilai, kuota, dan tanggal berlaku")
      return
    }
    if (draft.type === "persen" && draft.value > 100) {
      toast.error("Diskon persen tidak boleh lebih dari 100%")
      return
    }
    savePromo({ ...draft, code, description: draft.description.trim() })
    setDraft(null)
    toast.success("Promo tersimpan")
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kode atau aturan promo..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDraft(emptyPromo())}>
          <Plus className="size-4" /> Promo Baru
        </Button>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((promo: any) => {
          const usage = promo.quota
            ? Math.min(100, Math.round((promo.used / promo.quota) * 100))
            : 0
          return (
            <article
              key={promo.id}
              className={cn(
                "flex min-w-0 flex-col rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow",
                !promo.active && "opacity-65",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm">
                  <Ticket className="size-5" />
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={promo.active ? "success" : "neutral"}>
                    {promo.active ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <Switch
                    checked={promo.active}
                    onCheckedChange={(active) => savePromo({ ...promo, active })}
                    aria-label={`Toggle ${promo.code}`}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <code className="rounded-base border-2 border-dashed border-border bg-background px-2 py-1 font-heading text-sm font-extrabold">
                  {promo.code}
                </code>
                <span className="font-heading text-sm font-extrabold text-accent-pink">
                  {promo.type === "persen" ? `${promo.value}%` : formatIDR(promo.value)}
                </span>
              </div>
              <p className="mt-3 text-sm text-foreground/70">{promo.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-foreground/50">
                <span>Scope: {promo.scope ?? "all"}</span>
                <span>Min. {formatIDR(promo.minSpend)}</span>
                <span>Exp. {formatDate(promo.expiresAt)}</span>
              </div>
              <div className="mt-auto pt-5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Terpakai</span>
                  <span>
                    {promo.used}/{promo.quota}
                  </span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-border bg-background">
                  <div
                    className={cn("h-full", usage >= 100 ? "bg-danger" : "bg-accent-lime")}
                    style={{ width: `${usage}%` }}
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="neutral"
                    className="flex-1"
                    onClick={() => setDraft({ ...promo })}
                  >
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Hapus promo ${promo.code}?`)) {
                        removePromo(promo.id)
                        toast.success("Promo dihapus")
                      }
                    }}
                    aria-label={`Hapus ${promo.code}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-base border-2 border-dashed border-border p-12 text-center font-bold text-foreground/50">
            Tidak ada promo. Buat promo baru untuk mulai menyusun aturan.
          </div>
        )}
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {promos.some((promo: any) => promo.id === draft?.id) ? "Edit Promo" : "Promo Baru"}
            </DialogTitle>
            <DialogDescription>
              Atur nilai, scope, kuota, periode, dan status promo.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kode">
                  <Input
                    value={draft.code}
                    onChange={(event) => patch({ code: event.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="Tipe">
                  <Select
                    value={draft.type}
                    onValueChange={(type) => patch({ type: type as PromoType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persen">Persen</SelectItem>
                      <SelectItem value="nominal">Nominal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Deskripsi">
                <Textarea
                  value={draft.description}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Nilai">
                  <Input
                    type="number"
                    min={1}
                    value={draft.value}
                    onChange={(event) => patch({ value: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Min. belanja">
                  <Input
                    type="number"
                    min={0}
                    value={draft.minSpend}
                    onChange={(event) => patch({ minSpend: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Maks. diskon">
                  <Input
                    type="number"
                    min={0}
                    value={draft.maxDiscount ?? ""}
                    onChange={(event) =>
                      patch({ maxDiscount: event.target.value ? Number(event.target.value) : null })
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Scope">
                  <Select value={draft.scope ?? "all"} onValueChange={(scope) => patch({ scope })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua produk</SelectItem>
                      <SelectItem value="ai-chatbot">AI & Chatbot</SelectItem>
                      <SelectItem value="api-developer">API & Developer</SelectItem>
                      <SelectItem value="first-purchase">Pembelian pertama</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Kuota">
                  <Input
                    type="number"
                    min={1}
                    value={draft.quota}
                    onChange={(event) => patch({ quota: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Berakhir">
                  <Input
                    type="date"
                    value={draft.expiresAt}
                    onChange={(event) => patch({ expiresAt: event.target.value })}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-base border-2 border-border p-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4" />
                  <div>
                    <p className="text-sm font-bold">Promo aktif</p>
                    <p className="text-xs text-foreground/50">
                      Dapat digunakan selama aturan terpenuhi.
                    </p>
                  </div>
                </div>
                <Switch checked={draft.active} onCheckedChange={(active) => patch({ active })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="neutral" onClick={() => setDraft(null)}>
              Batal
            </Button>
            <Button onClick={save}>Simpan Promo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
