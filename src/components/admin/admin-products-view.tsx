"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { createProduct, deleteProduct, updateProduct } from "@/app/actions/admin-products"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { downloadCsv } from "@/lib/csv"
import { useAdminProducts } from "@/lib/api/queries"
import { formatIDR } from "@/lib/utils"
import type { AccountType, CategorySlug, Product, ProductVariant } from "@/types"

const CATEGORIES: CategorySlug[] = [
  "ai-chatbot",
  "desain-kreatif",
  "streaming",
  "produktivitas",
  "api-developer",
  "edukasi",
]
const ACCOUNT_TYPES: AccountType[] = ["sharing", "private", "invite", "lifetime"]

function minPrice(p: Product) {
  return p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0
}

function totalStock(p: Product) {
  return p.variants.reduce((sum, v) => sum + v.stock, 0)
}

function newVariant(): ProductVariant {
  return {
    id: `var-local-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    label: "1 Bulan Private",
    labelEn: "1 Month Private",
    type: "private",
    durationDays: 30,
    price: 50000,
    originalPrice: null,
    stock: 0,
  }
}

function emptyProduct(): Product {
  return {
    id: `prod-local-${Date.now()}`,
    slug: "",
    name: "",
    brand: "",
    tagline: "",
    taglineEn: "",
    description: "",
    descriptionEn: "",
    category: "ai-chatbot",
    image: "",
    gallery: [],
    logo: "#",
    accent: "accent-cyan",
    badges: [],
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    featured: false,
    variants: [newVariant()],
    features: [],
    featuresEn: [],
    faqs: [],
  }
}

function cloneProduct(product: Product): Product {
  return {
    ...product,
    variants: product.variants.map((variant) => ({ ...variant })),
    badges: [...product.badges],
    features: [...product.features],
    featuresEn: [...product.featuresEn],
    faqs: product.faqs.map((faq) => ({ ...faq })),
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/** Maps a Product draft to the shape expected by the createProduct/updateProduct server action. */
function toActionInput(draft: Product): Parameters<typeof createProduct>[0] {
  return {
    slug: draft.slug,
    name: draft.name.trim(),
    brand: draft.brand.trim(),
    tagline: draft.tagline,
    taglineEn: draft.taglineEn || draft.tagline,
    description: draft.description,
    descriptionEn: draft.descriptionEn || draft.description,
    image: draft.image,
    logo: draft.logo,
    accent: draft.accent,
    categoryId: draft.category,
    badges: draft.badges as never[], // ponytail: ProductBadge → zod enum mismatch; cast until badge types are unified
    features: draft.features,
    featuresEn: draft.featuresEn.length ? draft.featuresEn : draft.features,
    featured: draft.featured,
    faqs: draft.faqs,
  }
}

export function AdminProductsView() {
  const queryClient = useQueryClient()
  const { data: productsData } = useAdminProducts()
  const catalog: Product[] = productsData?.data ?? []
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<Product | null>(null)
  const [preview, setPreview] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    if (!needle) return catalog
    return catalog.filter((product) =>
      [product.name, product.brand, product.slug, product.category]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
  }, [catalog, query])

  const isExisting = (id: string) => catalog.some((item) => item.id === id)

  const saveMutation = useMutation({
    mutationFn: async (product: Product) => {
      const input = toActionInput(product)
      if (isExisting(product.id)) {
        return updateProduct(product.id, input)
      }
      return createProduct(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
    },
  })

  function patchProduct(patch: Partial<Product>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  function patchVariant(id: string, patch: Partial<ProductVariant>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            variants: current.variants.map((variant) =>
              variant.id === id ? { ...variant, ...patch } : variant,
            ),
          }
        : current,
    )
  }

  async function save() {
    if (!draft) return
    const slug = draft.slug || slugify(draft.name)
    if (
      draft.name.trim().length < 2 ||
      draft.brand.trim().length < 2 ||
      !slug ||
      draft.variants.length === 0
    ) {
      toast.error("Nama, brand, slug, dan minimal satu varian wajib diisi")
      return
    }
    if (
      draft.variants.some(
        (variant) => variant.label.trim().length < 2 || variant.price < 0 || variant.stock < 0,
      )
    ) {
      toast.error("Periksa label, harga, dan stok setiap varian")
      return
    }
    const payload: Product = {
      ...draft,
      slug,
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      taglineEn: draft.taglineEn || draft.tagline,
      descriptionEn: draft.descriptionEn || draft.description,
      featuresEn: draft.featuresEn.length ? draft.featuresEn : draft.features,
    }
    try {
      await saveMutation.mutateAsync(payload)
      setDraft(null)
      toast.success("Produk tersimpan")
    } catch {
      toast.error("Gagal menyimpan produk")
    }
  }

  async function remove(id: string) {
    const product = catalog.find((item) => item.id === id)
    if (!product || !window.confirm(`Hapus ${product.name}?`)) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success("Produk dihapus")
    } catch {
      toast.error("Gagal menghapus produk")
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari produk, brand, kategori..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="neutral"
            onClick={() =>
              downloadCsv(
                "produk.csv",
                filtered.map((product) => ({
                  id: product.id,
                  produk: product.name,
                  brand: product.brand,
                  kategori: product.category,
                  harga_mulai: minPrice(product),
                  stok: totalStock(product),
                  varian: product.variants.length,
                  featured: String(product.featured),
                })),
              )
            }
          >
            <Download className="size-4" /> Export
          </Button>
          <Button onClick={() => setDraft(emptyProduct())}>
            <Plus className="size-4" /> Produk Baru
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Varian</TableHead>
            <TableHead>Harga Mulai</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-main text-xl shadow-shadow-sm">
                    {product.logo}
                  </span>
                  <div>
                    <p className="font-bold">{product.name}</p>
                    <p className="text-xs text-foreground/60">
                      {product.brand} - /{product.slug}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="neutral">{product.category}</Badge>
              </TableCell>
              <TableCell className="font-bold">{product.variants.length}</TableCell>
              <TableCell className="font-heading font-bold">
                {formatIDR(minPrice(product))}
              </TableCell>
              <TableCell className="font-heading font-bold">{totalStock(product)}</TableCell>
              <TableCell>
                <Badge variant={product.featured ? "success" : "neutral"}>
                  {product.featured ? "Featured" : "Active"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setPreview(product)}
                    aria-label={`Preview ${product.name}`}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="neutral"
                    onClick={() => setDraft(cloneProduct(product))}
                    aria-label={`Edit ${product.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="danger"
                    onClick={() => remove(product.id)}
                    aria-label={`Hapus ${product.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-14 text-center font-bold text-foreground/60">
                Belum ada produk yang cocok. Gunakan Produk Baru untuk membuat katalog.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {draft && isExisting(draft.id) ? "Edit Produk" : "Produk Baru"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi identitas, varian, harga, stok, konten, dan preview produk.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nama produk">
                    <Input
                      value={draft.name}
                      onChange={(event) =>
                        patchProduct({
                          name: event.target.value,
                          slug: draft.slug || slugify(event.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Brand">
                    <Input
                      value={draft.brand}
                      onChange={(event) => patchProduct({ brand: event.target.value })}
                    />
                  </Field>
                  <Field label="Slug">
                    <Input
                      value={draft.slug}
                      onChange={(event) => patchProduct({ slug: slugify(event.target.value) })}
                    />
                  </Field>
                  <Field label="Kategori">
                    <Select
                      value={draft.category}
                      onValueChange={(value) => patchProduct({ category: value as CategorySlug })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Logo singkat">
                    <Input
                      value={draft.logo}
                      onChange={(event) => patchProduct({ logo: event.target.value.slice(0, 4) })}
                    />
                  </Field>
                  <Field label="Accent">
                    <Select
                      value={draft.accent}
                      onValueChange={(accent) => patchProduct({ accent })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "accent-cyan",
                          "accent-pink",
                          "accent-lime",
                          "accent-purple",
                          "accent-blue",
                        ].map((accent) => (
                          <SelectItem key={accent} value={accent}>
                            {accent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Tagline">
                  <Input
                    value={draft.tagline}
                    onChange={(event) => patchProduct({ tagline: event.target.value })}
                  />
                </Field>
                <Field label="Deskripsi">
                  <Textarea
                    value={draft.description}
                    onChange={(event) => patchProduct({ description: event.target.value })}
                  />
                </Field>
                <Field label="Fitur (satu per baris)">
                  <Textarea
                    value={draft.features.join("\n")}
                    onChange={(event) =>
                      patchProduct({ features: event.target.value.split("\n").filter(Boolean) })
                    }
                  />
                </Field>
                <div className="flex items-center justify-between rounded-base border-2 border-border p-3">
                  <div>
                    <p className="font-heading text-sm font-bold">Featured</p>
                    <p className="text-xs text-foreground/60">Tampilkan pada rekomendasi utama.</p>
                  </div>
                  <Switch
                    checked={draft.featured}
                    onCheckedChange={(featured) => patchProduct({ featured })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-sm font-extrabold">Varian</h3>
                      <p className="text-xs text-foreground/60">
                        Setiap varian memiliki tipe, durasi, harga, dan stok sendiri.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="neutral"
                      onClick={() => patchProduct({ variants: [...draft.variants, newVariant()] })}
                    >
                      <Plus className="size-4" /> Varian
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {draft.variants.map((variant, index) => (
                      <div
                        key={variant.id}
                        className="rounded-base border-2 border-border bg-background p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="font-heading text-sm font-bold">Varian {index + 1}</p>
                          <Button
                            size="icon-sm"
                            variant="danger"
                            disabled={draft.variants.length === 1}
                            onClick={() =>
                              patchProduct({
                                variants: draft.variants.filter((item) => item.id !== variant.id),
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Field label="Label">
                            <Input
                              value={variant.label}
                              onChange={(event) =>
                                patchVariant(variant.id, {
                                  label: event.target.value,
                                  labelEn: event.target.value,
                                })
                              }
                            />
                          </Field>
                          <Field label="Tipe">
                            <Select
                              value={variant.type}
                              onValueChange={(value) =>
                                patchVariant(variant.id, { type: value as AccountType })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACCOUNT_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Durasi hari">
                            <Input
                              type="number"
                              value={variant.durationDays ?? ""}
                              onChange={(event) =>
                                patchVariant(variant.id, {
                                  durationDays: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                })
                              }
                            />
                          </Field>
                          <Field label="Harga">
                            <Input
                              type="number"
                              min={0}
                              value={variant.price}
                              onChange={(event) =>
                                patchVariant(variant.id, { price: Number(event.target.value) })
                              }
                            />
                          </Field>
                          <Field label="Harga coret">
                            <Input
                              type="number"
                              min={0}
                              value={variant.originalPrice ?? ""}
                              onChange={(event) =>
                                patchVariant(variant.id, {
                                  originalPrice: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                })
                              }
                            />
                          </Field>
                          <Field label="Stok">
                            <Input
                              type="number"
                              min={0}
                              value={variant.stock}
                              onChange={(event) =>
                                patchVariant(variant.id, { stock: Number(event.target.value) })
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="h-fit rounded-base border-2 border-border bg-main p-4 shadow-shadow">
                <p className="text-xs font-extrabold uppercase text-main-foreground/55">Preview</p>
                <span className="mt-4 flex size-12 items-center justify-center rounded-base border-2 border-border bg-secondary-background text-2xl shadow-shadow-sm">
                  {draft.logo || "#"}
                </span>
                <h3 className="mt-4 font-heading text-xl font-extrabold">
                  {draft.name || "Nama produk"}
                </h3>
                <p className="text-sm font-bold text-main-foreground/60">
                  {draft.brand || "Brand"}
                </p>
                <p className="mt-3 text-sm text-main-foreground/75">
                  {draft.tagline || "Tagline produk akan tampil di sini."}
                </p>
                <div className="mt-5 border-t-2 border-dashed border-border pt-4">
                  <p className="text-xs font-bold text-main-foreground/55">Mulai dari</p>
                  <p className="font-heading text-2xl font-extrabold">
                    {formatIDR(minPrice(draft))}
                  </p>
                  <p className="text-xs font-bold text-main-foreground/55">
                    {draft.variants.length} varian -{" "}
                    {totalStock(draft)} stok
                  </p>
                </div>
              </aside>
            </div>
          )}
          <DialogFooter>
            <Button variant="neutral" onClick={() => setDraft(null)}>
              Batal
            </Button>
            <Button onClick={save} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Produk</DialogTitle>
            <DialogDescription>Ringkasan tampilan data katalog.</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="rounded-base border-2 border-border bg-main p-6 shadow-shadow">
              <span className="text-4xl">{preview.logo}</span>
              <h2 className="mt-4 font-heading text-2xl font-extrabold">{preview.name}</h2>
              <p className="font-bold text-main-foreground/60">{preview.brand}</p>
              <p className="mt-3">{preview.tagline}</p>
              <div className="mt-5 grid gap-2">
                {preview.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-base border-2 border-border bg-secondary-background p-3"
                  >
                    <div>
                      <p className="font-bold">{variant.label}</p>
                      <p className="text-xs text-foreground/60">
                        {variant.type} - stok {variant.stock}
                      </p>
                    </div>
                    <p className="font-heading font-extrabold">{formatIDR(variant.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
