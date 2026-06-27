"use client"

import { Download, Pencil, Search } from "lucide-react"
import { useMemo, useState } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { downloadCsv } from "@/lib/csv"
import { productMinPrice, products, productTotalStock } from "@/lib/mock/products"
import { formatPrice } from "@/lib/utils"
import { useAdminOverlay } from "@/stores/admin-overlay"

export default function AdminProductsPage() {
  const patches = useAdminOverlay((s) => s.productPatches)
  const setProductPatch = useAdminOverlay((s) => s.setProductPatch)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState("")
  const [stockInput, setStockInput] = useState("")

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products
      .map((p) => {
        const patch = patches[p.id] ?? {}
        return {
          p,
          price: patch.price ?? productMinPrice(p),
          stock: patch.stock ?? productTotalStock(p),
          edited: patch.price != null || patch.stock != null,
        }
      })
      .filter(
        (r) => !q || r.p.name.toLowerCase().includes(q) || r.p.brand.toLowerCase().includes(q),
      )
  }, [patches, search])

  const editP = products.find((p) => p.id === editing)

  function openEdit(id: string, price: number, stock: number) {
    setEditing(id)
    setPriceInput(String(price))
    setStockInput(String(stock))
  }

  function save() {
    if (!editing) return
    setProductPatch(editing, {
      price: Math.max(0, Number(priceInput) || 0),
      stock: Math.max(0, Number(stockInput) || 0),
    })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="pl-9"
          />
        </div>
        <Button
          variant="neutral"
          className="shrink-0"
          onClick={() =>
            downloadCsv(
              "produk.csv",
              rows.map((r) => ({
                produk: r.p.name,
                brand: r.p.brand,
                kategori: r.p.category,
                harga_mulai: r.price,
                stok: r.stock,
              })),
            )
          }
        >
          <Download className="size-4" /> Export
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Harga Mulai</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ p, price, stock, edited }) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.logo}</span>
                  <div className="flex flex-col">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-xs text-foreground/50">{p.brand}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-foreground/70">{p.category}</TableCell>
              <TableCell className="font-heading font-bold">
                {formatPrice(price)}
                {edited && (
                  <span className="ml-1 text-xs font-bold text-accent-pink">• diubah</span>
                )}
              </TableCell>
              <TableCell className="font-heading font-bold">{stock}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="icon-sm"
                  variant="neutral"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => openEdit(p.id, price, stock)}
                >
                  <Pencil className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>
              {editP?.name} — perubahan disimpan untuk sesi ini (demo).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-price">Harga mulai (Rp)</Label>
              <Input
                id="edit-price"
                inputMode="numeric"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-stock">Stok</Label>
              <Input
                id="edit-stock"
                inputMode="numeric"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
