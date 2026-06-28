"use client"

import type { LucideIcon } from "lucide-react"
import { CornerDownLeft, Moon, Search, Sparkles, Store, Sun, UserCog } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { NAV } from "@/components/admin/admin-shell"
import { useRouter } from "@/i18n/navigation"
import { ADMIN_ROLE_LABELS, roleCan, useEnterpriseAdmin } from "@/stores/enterprise-admin"
import type { AdminPermission } from "@/types"
import { cn } from "@/lib/utils"

// ⌘K command palette + global keyboard nav for the admin shell.
// - Cmd/Ctrl+K toggles the palette
// - `?` opens a shortcuts help dialog (when not typing)
// - `g <key>` jumps to a module (when not typing) — see GOTO map below

const GOTO: { key: string; href: string; label: string }[] = [
  { key: "d", href: "/admin", label: "Dashboard" },
  { key: "p", href: "/admin/produk", label: "Produk" },
  { key: "m", href: "/admin/promo", label: "Promo" },
  { key: "o", href: "/admin/pesanan", label: "Pesanan" },
  { key: "t", href: "/admin/transaksi", label: "Transaksi" },
  { key: "f", href: "/admin/fulfillment", label: "Fulfillment" },
  { key: "i", href: "/admin/risiko", label: "Risk Review" },
  { key: "k", href: "/admin/stok", label: "Stok Akun" },
  { key: "r", href: "/admin/refund", label: "Refund" },
  { key: "c", href: "/admin/pelanggan", label: "Pelanggan" },
  { key: "e", href: "/admin/reseller", label: "Reseller" },
  { key: "s", href: "/admin/tiket", label: "Tiket Bantuan" },
  { key: "u", href: "/admin/ulasan", label: "Ulasan & Tanya" },
  { key: "a", href: "/admin/analitik", label: "Analitik" },
  { key: "x", href: "/admin/tim", label: "Tim & Role" },
  { key: "b", href: "/admin/audit", label: "Audit Log" },
]

interface Command {
  id: string
  label: string
  group: string
  icon: LucideIcon
  hint?: string
  permission?: AdminPermission
  run: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
}

export function CommandPalette() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [openPalette, setOpenPalette] = useState(false)
  const [openHelp, setOpenHelp] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const openRef = useRef({ palette: false, help: false })
  openRef.current.palette = openPalette
  openRef.current.help = openHelp

  const activeStaffId = useEnterpriseAdmin((s) => s.activeStaffId)
  const staff = useEnterpriseAdmin((s) => s.staff)
  const setActiveStaff = useEnterpriseAdmin((s) => s.setActiveStaff)
  const role = staff.find((m) => m.id === activeStaffId)?.role ?? "owner"

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = NAV.filter((item) => roleCan(role, item.permission)).map((item) => ({
      id: `nav:${item.href}`,
      label: item.label,
      group: "Navigasi",
      icon: item.icon,
      hint: GOTO.find((g) => g.href === item.href)?.key
        ? `g ${GOTO.find((g) => g.href === item.href)?.key}`
        : undefined,
      run: () => {
        router.push(item.href)
        setOpenPalette(false)
      },
    }))
    const actions: Command[] = [
      {
        id: "action:theme",
        label: "Ganti tema (terang/gelap)",
        group: "Aksi",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        run: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark")
          setOpenPalette(false)
        },
      },
      {
        id: "action:store",
        label: "Buka toko (storefront)",
        group: "Aksi",
        icon: Store,
        run: () => {
          router.push("/")
          setOpenPalette(false)
        },
      },
      {
        id: "action:help",
        label: "Bantuan & daftar shortcut",
        group: "Aksi",
        icon: Sparkles,
        hint: "?",
        run: () => {
          setOpenPalette(false)
          setOpenHelp(true)
        },
      },
    ]
    const roleSwitch: Command[] = staff
      .filter((m) => m.status !== "suspended" && m.id !== activeStaffId)
      .map((m) => ({
        id: `role:${m.id}`,
        label: `Pratinjau role: ${m.name} (${ADMIN_ROLE_LABELS[m.role]})`,
        group: "Ganti role",
        icon: UserCog,
        run: () => {
          setActiveStaff(m.id)
          setOpenPalette(false)
        },
      }))
    return [...nav, ...actions, ...roleSwitch]
  }, [router, resolvedTheme, setTheme, staff, activeStaffId, role, setActiveStaff])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (openPalette) {
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
    setQuery("")
  }, [openPalette])

  // Global keyboard handler: Cmd/Ctrl+K, `?`, and `g <key>` goto sequences.
  useEffect(() => {
    let gotoPending = false
    let gotoTimer: ReturnType<typeof setTimeout> | null = null

    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpenPalette((v) => !v)
        return
      }
      if (isTypingTarget(e.target)) return
      if (openRef.current.palette || openRef.current.help) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === "?") {
        e.preventDefault()
        setOpenHelp(true)
        return
      }
      if (e.key.toLowerCase() === "g") {
        gotoPending = true
        if (gotoTimer) clearTimeout(gotoTimer)
        gotoTimer = setTimeout(() => {
          gotoPending = false
        }, 1000)
        return
      }
      if (gotoPending) {
        gotoPending = false
        if (gotoTimer) clearTimeout(gotoTimer)
        const match = GOTO.find((g) => g.key === e.key.toLowerCase())
        if (match) {
          e.preventDefault()
          router.push(match.href)
        }
      }
    }

    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      if (gotoTimer) clearTimeout(gotoTimer)
    }
  }, [router])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const cmd = filtered[active]
      if (cmd) cmd.run()
    }
  }

  // Keep the active row scrolled into view.
  useEffect(() => {
    const container = listRef.current
    if (!container) return
    const row = container.querySelector<HTMLElement>(`[data-cmd-idx="${active}"]`)
    row?.scrollIntoView({ block: "nearest" })
  }, [active])

  let lastGroup = ""

  return (
    <>
      <Button
        variant="neutral"
        size="sm"
        className="hidden h-9 gap-2 px-3 sm:flex"
        onClick={() => setOpenPalette(true)}
        aria-label="Buka command palette"
      >
        <Search className="size-4" />
        <span className="text-foreground/60">Cari…</span>
        <kbd className="ml-2 rounded-base border-2 border-border bg-background px-1.5 py-0.5 text-[10px] font-bold">
          ⌘K
        </kbd>
      </Button>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm sm:hidden"
        onClick={() => setOpenPalette(true)}
        aria-label="Buka command palette"
      >
        <Search className="size-4" />
      </button>

      <Dialog open={openPalette} onOpenChange={setOpenPalette}>
        <DialogContent className="top-[12vh] max-w-xl -translate-y-0 gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Command palette</DialogTitle>
            <DialogDescription>Cari modul atau aksi admin.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 border-b-2 border-border px-4 py-3">
            <Search className="size-4 text-foreground/50" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ketik perintah atau modul…"
              className="min-w-0 flex-1 bg-transparent font-heading text-sm font-bold outline-none placeholder:text-foreground/40"
            />
            <kbd className="rounded-base border-2 border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-foreground/60">
              esc
            </kbd>
          </div>
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm font-bold text-foreground/50">
                Tidak ada yang cocok.
              </p>
            )}
            {filtered.map((cmd, i) => {
              const showGroup = cmd.group !== lastGroup
              lastGroup = cmd.group
              const Icon = cmd.icon
              return (
                <div key={cmd.id}>
                  {showGroup && (
                    <p className="mt-2 px-3 pb-1 text-[10px] font-extrabold uppercase text-foreground/40">
                      {cmd.group}
                    </p>
                  )}
                  <button
                    type="button"
                    data-cmd-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => cmd.run()}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-base border-2 border-transparent px-3 py-2 text-left text-sm font-bold transition-all",
                      i === active
                        ? "border-border bg-main text-main-foreground"
                        : "text-foreground/80 hover:bg-foreground/5",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                    {cmd.hint && (
                      <kbd
                        className={cn(
                          "shrink-0 rounded-base border-2 px-1.5 py-0.5 text-[10px] font-bold",
                          i === active
                            ? "border-main-foreground/30 bg-main-foreground/10"
                            : "border-border bg-background text-foreground/60",
                        )}
                      >
                        {cmd.hint}
                      </kbd>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openHelp} onOpenChange={setOpenHelp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Shortcut keyboard admin</DialogTitle>
            <DialogDescription>
              Berlaku di seluruh admin shell, kecuali saat mengetik di input.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-extrabold uppercase text-foreground/40">Umum</p>
              <ul className="flex flex-col gap-1.5 text-sm font-bold">
                <li className="flex items-center justify-between gap-3">
                  <span>Buka command palette</span>
                  <kbd className="rounded-base border-2 border-border bg-background px-2 py-0.5 text-xs">
                    ⌘ / Ctrl + K
                  </kbd>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span>Buka bantuan ini</span>
                  <kbd className="rounded-base border-2 border-border bg-background px-2 py-0.5 text-xs">
                    ?
                  </kbd>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-extrabold uppercase text-foreground/40">
                Lompat ke modul (g lalu huruf)
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {GOTO.map((g) => (
                  <div
                    key={g.key}
                    className="flex items-center justify-between gap-2 rounded-base border-2 border-border bg-secondary-background px-2 py-1 text-xs font-bold"
                  >
                    <span className="truncate">{g.label}</span>
                    <kbd className="rounded-base border-2 border-border bg-background px-1.5 py-0.5 text-[10px]">
                      g {g.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t-2 border-border pt-4 text-sm text-foreground/60">
            <CornerDownLeft className="size-4" />
            <span>Enter menjalankan perintah aktif di palette.</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
