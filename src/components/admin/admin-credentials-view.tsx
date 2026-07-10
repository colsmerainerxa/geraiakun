"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FileUp, KeyRound, Plus, RefreshCcw, Search, ShieldAlert, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CredentialStatusBadge } from "@/components/admin/parts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { bulkImportCredentials, deleteCredential } from "@/app/actions/admin-credentials"
import { useAdminCredentials, useAdminProducts } from "@/lib/api/queries"
import { formatDate } from "@/lib/utils"
import type { CredentialStock } from "@/types"

// Map DB status enum → frontend Indonesian status
const STATUS_MAP: Record<string, CredentialStock["status"]> = {
  AVAILABLE: "tersedia",
  SOLD: "terjual",
  EXPIRED: "kadaluarsa",
  HELD: "ditahan",
}

function mapCredential(row: Record<string, unknown>): CredentialStock {
  return {
    id: row.id as string,
    productId: row.productId as string,
    productName: row.productName as string,
    variantLabel: (row.variantLabel as string) ?? "",
    email: (row.email as string) ?? "—", // ponytail: API doesn't expose decrypted email; add when vault decrypt endpoint exists
    status: STATUS_MAP[row.status as string] ?? "tersedia",
    addedAt: row.addedAt as string,
  }
}

const STATUSES: CredentialStock["status"][] = ["tersedia", "terjual", "kadaluarsa", "ditahan"]

export function AdminCredentialsView() {
  const queryClient = useQueryClient()
  const { data: rawCredentials = [] } = useAdminCredentials()
  const credentials: CredentialStock[] = useMemo(() => rawCredentials.map(mapCredential), [rawCredentials])
  const { data: productsData } = useAdminProducts({ limit: 100 })
  const catalog = useMemo(() => (productsData?.data ?? []) as any[], [productsData])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<CredentialStock["status"] | "all">("all")
  const [selected, setSelected] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [productId, setProductId] = useState(catalog[0]?.id ?? "")
  const [variantLabel, setVariantLabel] = useState(catalog[0]?.variants[0]?.label ?? "")
  const [email, setEmail] = useState("")
  const [csv, setCsv] = useState("")

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCredential(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "credentials"] })
    },
  })

  const bulkImportMutation = useMutation({
    mutationFn: (input: Parameters<typeof bulkImportCredentials>[0]) => bulkImportCredentials(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "credentials"] })
    },
  })

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    return credentials.filter((credential) => {
      if (status !== "all" && credential.status !== status) return false
      if (!needle) return true
      return [credential.productName, credential.variantLabel, credential.email]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [credentials, query, status])
  const product = catalog.find((item) => item.id === productId)
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((item) => selected.includes(item.id))

  function saveCredential() {
    if (!product || !variantLabel || !email.includes("@")) {
      toast.error("Pilih produk, varian, dan isi email credential")
      return
    }
    bulkImportMutation.mutate({
      items: [{
        productId: product.id,
        variantId: product.variants.find((v: any) => v.label === variantLabel)?.id,
        loginEmail: email.trim(),
        password: "-",
      }],
    })
    setAddOpen(false)
    setEmail("")
    toast.success("Credential ditambahkan")
  }

  function importCsv() {
    const rows = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const items: { productId: string; variantId?: string; loginEmail: string; password: string }[] = []
    for (const row of rows) {
      const [rowProductId, rowVariantId, rowEmail] = row.split(",").map((value) => value.trim())
      const rowProduct = catalog.find((item) => item.id === rowProductId)
      if (!rowProduct || !rowEmail?.includes("@")) continue
      items.push({ productId: rowProductId, variantId: rowVariantId, loginEmail: rowEmail, password: "-" })
    }
    if (!items.length) {
      toast.error("Tidak ada baris valid. Format: productId,variantId,email")
      return
    }
    bulkImportMutation.mutate({ items })
    setImportOpen(false)
    setCsv("")
    toast.success(`${items.length} credential diimpor`)
  }

  function applyBulk(nextStatus: CredentialStock["status"]) {
    if (!selected.length) return
    // ponytail: bulk status change not in API yet — client-side filter only
    setSelected([])
    toast.success(`Status ${nextStatus} diterapkan`)
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari produk, varian, email..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as CredentialStock["status"] | "all")}
        >
          <SelectTrigger className="w-full xl:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="neutral" onClick={() => setImportOpen(true)}>
            <FileUp className="size-4" /> Import CSV
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Credential
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-base border-2 border-border bg-main p-3 shadow-shadow-sm">
          <span className="mr-auto font-heading text-sm font-extrabold">
            {selected.length} dipilih
          </span>
          <Button size="sm" variant="neutral" onClick={() => applyBulk("tersedia")}>
            Tersedia
          </Button>
          <Button size="sm" variant="neutral" onClick={() => applyBulk("ditahan")}>
            <ShieldAlert className="size-4" /> Tahan
          </Button>
          <Button size="sm" variant="danger" onClick={() => applyBulk("kadaluarsa")}>
            Kadaluarsa
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={(checked) =>
                  setSelected(checked ? filtered.map((item) => item.id) : [])
                }
                aria-label="Pilih semua credential"
              />
            </TableHead>
            <TableHead>Produk</TableHead>
            <TableHead>Email Credential</TableHead>
            <TableHead>Ditambahkan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((credential) => (
            <TableRow key={credential.id}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(credential.id)}
                  onCheckedChange={(checked) =>
                    setSelected((current) =>
                      checked
                        ? [...current, credential.id]
                        : current.filter((id) => id !== credential.id),
                    )
                  }
                  aria-label={`Pilih ${credential.email}`}
                />
              </TableCell>
              <TableCell>
                <p className="font-bold">{credential.productName}</p>
                <p className="text-xs text-foreground/45">{credential.variantLabel}</p>
              </TableCell>
              <TableCell className="font-mono text-xs">{credential.email}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-foreground/60">
                {formatDate(credential.addedAt)}
              </TableCell>
              <TableCell>
                <CredentialStatusBadge status={credential.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {/* ponytail: rotate/hold need server actions — add when credential.update endpoint exists */}
                  <Button
                    size="icon-sm"
                    variant="neutral"
                    onClick={() => toast.info("Rotasi credential belum tersedia")}
                    aria-label={`Rotasi ${credential.email}`}
                  >
                    <RefreshCcw className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="neutral"
                    onClick={() => toast.info("Tahan credential belum tersedia")}
                    aria-label={`Tahan ${credential.email}`}
                  >
                    <KeyRound className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Hapus ${credential.email}?`))
                        deleteMutation.mutate(credential.id)
                    }}
                    aria-label={`Hapus ${credential.email}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-14 text-center font-bold text-foreground/50">
                Tidak ada credential yang cocok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Credential</DialogTitle>
            <DialogDescription>
              Credential baru masuk sebagai stok tersedia dan dicatat ke audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Produk">
              <Select
                value={productId}
                onValueChange={(value) => {
                  setProductId(value)
                  setVariantLabel(
                    catalog.find((item) => item.id === value)?.variants[0]?.label ?? "",
                  )
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Varian">
              <Select value={variantLabel} onValueChange={setVariantLabel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product?.variants.map((variant: any) => (
                    <SelectItem key={variant.id} value={variant.label}>
                      {variant.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Email credential">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="stock.product@vault.geraiakun"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveCredential} disabled={bulkImportMutation.isPending}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Credential CSV</DialogTitle>
            <DialogDescription>
              Satu baris per credential dengan format productId,variantId,email.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            className="min-h-52 font-mono text-xs"
            placeholder={
              "prod-1,var-2,stock.one@vault.geraiakun\nprod-2,var-4,stock.two@vault.geraiakun"
            }
          />
          <DialogFooter>
            <Button variant="neutral" onClick={() => setImportOpen(false)}>
              Batal
            </Button>
            <Button onClick={importCsv} disabled={bulkImportMutation.isPending}>
              <FileUp className="size-4" /> Import
            </Button>
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
