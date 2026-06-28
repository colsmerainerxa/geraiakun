"use client"

import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircleQuestion,
  Package,
  Receipt,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Ticket,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { CommandPalette } from "@/components/admin/command-palette"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link, usePathname } from "@/i18n/navigation"
import { ADMIN_ROLE_LABELS, roleCan, useEnterpriseAdmin } from "@/stores/enterprise-admin"
import { levelForXp, levelProgress, useAdminGamification } from "@/stores/admin-gamification"
import type { AdminPermission } from "@/types"
import { cn, initials } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  permission: AdminPermission
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/produk", label: "Produk", icon: Package, permission: "products.manage" },
      { href: "/admin/promo", label: "Promo", icon: Ticket, permission: "promos.manage" },
      { href: "/admin/pesanan", label: "Pesanan", icon: ShoppingBag, permission: "orders.manage" },
      {
        href: "/admin/transaksi",
        label: "Transaksi",
        icon: Receipt,
        permission: "transactions.view",
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      {
        href: "/admin/fulfillment",
        label: "Fulfillment",
        icon: ClipboardList,
        permission: "fulfillment.manage",
      },
      { href: "/admin/risiko", label: "Risk Review", icon: ShieldAlert, permission: "risk.manage" },
      { href: "/admin/stok", label: "Stok Akun", icon: KeyRound, permission: "credentials.manage" },
      { href: "/admin/refund", label: "Refund", icon: RotateCcw, permission: "refunds.manage" },
    ],
  },
  {
    label: "Pelanggan",
    items: [
      { href: "/admin/pelanggan", label: "Pelanggan", icon: Users, permission: "customers.view" },
      {
        href: "/admin/reseller",
        label: "Reseller",
        icon: UsersRound,
        permission: "resellers.manage",
      },
      {
        href: "/admin/tiket",
        label: "Tiket Bantuan",
        icon: MessageCircleQuestion,
        permission: "tickets.manage",
      },
      { href: "/admin/ulasan", label: "Ulasan & Tanya", icon: Star, permission: "reviews.manage" },
    ],
  },
  {
    label: "Insight",
    items: [
      { href: "/admin/analitik", label: "Analitik", icon: BarChart3, permission: "analytics.view" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/tim", label: "Tim & Role", icon: UserCog, permission: "staff.manage" },
      { href: "/admin/audit", label: "Audit Log", icon: ScrollText, permission: "audit.view" },
    ],
  },
]

export const NAV = NAV_GROUPS.flatMap((group) => group.items)

function useActive() {
  const pathname = usePathname()
  return (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useActive()
  const activeStaffId = useEnterpriseAdmin((state) => state.activeStaffId)
  const staff = useEnterpriseAdmin((state) => state.staff)
  const role = staff.find((member) => member.id === activeStaffId)?.role ?? "owner"

  return (
    <nav className="flex flex-col gap-5" aria-label="Navigasi admin">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => roleCan(role, item.permission))
        if (items.length === 0) return null
        return (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-extrabold uppercase text-foreground/40">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-base border-2 px-3 py-2 font-heading text-sm font-bold transition-all",
                      active
                        ? "border-border bg-main text-main-foreground shadow-shadow-sm"
                        : "border-transparent text-foreground/70 hover:border-border hover:bg-secondary-background",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm">
        <Sparkles className="size-5" />
      </span>
      <span className="font-heading text-lg font-extrabold">
        beli<span className="text-accent-pink">akun</span>
        <span className="ml-1 align-top text-[10px] font-bold uppercase text-foreground/50">
          admin
        </span>
      </span>
    </Link>
  )
}

function RoleSwitcher() {
  const activeStaffId = useEnterpriseAdmin((state) => state.activeStaffId)
  const staff = useEnterpriseAdmin((state) => state.staff)
  const setActiveStaff = useEnterpriseAdmin((state) => state.setActiveStaff)

  return (
    <div className="rounded-base border-2 border-dashed border-border p-3">
      <p className="mb-2 text-[10px] font-extrabold uppercase text-foreground/45">Pratinjau role</p>
      <Select value={activeStaffId} onValueChange={setActiveStaff}>
        <SelectTrigger className="h-10 bg-secondary-background text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {staff
            .filter((member) => member.status !== "suspended")
            .map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} - {ADMIN_ROLE_LABELS[member.role]}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <Brand />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <RoleSwitcher />
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-base border-2 border-transparent px-3 py-2 font-heading text-sm font-bold text-foreground/70 transition-all hover:border-border hover:bg-secondary-background"
      >
        <Store className="size-4" /> Kembali ke Toko
      </Link>
    </div>
  )
}

function LevelBadge() {
  const xp = useAdminGamification((s) => s.xp)
  const streak = useAdminGamification((s) => s.streak)
  const level = levelForXp(xp)
  const { pct } = levelProgress(xp)
  return (
    <span
      className="hidden items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-2 py-1 shadow-shadow-sm sm:flex"
      title={`Level ${level} · ${xp} XP · streak ${streak} hari`}
    >
      <span className="flex size-6 items-center justify-center rounded-base border-2 border-border bg-main font-heading text-[11px] font-extrabold text-main-foreground">
        {level}
      </span>
      <span className="h-2 w-12 overflow-hidden rounded-full border-2 border-border bg-background">
        <span className="block h-full bg-accent-lime" style={{ width: `${pct}%` }} />
      </span>
    </span>
  )
}

function PermissionDenied({ role }: { role: string }) {  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-base border-2 border-dashed border-border p-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-base border-2 border-border bg-warning shadow-shadow">
        <LockKeyhole className="size-8" />
      </span>
      <h2 className="mt-5 font-heading text-2xl font-extrabold">Akses tidak tersedia</h2>
      <p className="mt-2 max-w-md text-sm text-foreground/60">
        Role {role} tidak memiliki izin untuk membuka modul ini. Ganti pratinjau role atau kembali
        ke dashboard.
      </p>
      <Button asChild className="mt-5">
        <Link href="/admin">Kembali ke Dashboard</Link>
      </Button>
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common")
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const activeStaffId = useEnterpriseAdmin((state) => state.activeStaffId)
  const staff = useEnterpriseAdmin((state) => state.staff)
  const member = staff.find((item) => item.id === activeStaffId) ?? staff[0]
  const current = NAV.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
  )
  const title = current?.label ?? "Dashboard"
  const allowed = current ? roleCan(member.role, current.permission) : true

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-base focus:border-2 focus:border-border focus:bg-main focus:px-4 focus:py-2 focus:font-heading focus:text-sm focus:font-bold focus:text-main-foreground focus:shadow-shadow"
      >
        {t("skipToContent")}
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r-2 border-border bg-background p-5 lg:block">
        <SidebarInner />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-2 border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm lg:hidden"
                aria-label="Menu"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="sr-only">{t("adminMenu")}</SheetTitle>
              </SheetHeader>
              <SidebarInner onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1 className="font-heading text-xl font-extrabold">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <LevelBadge />
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-2 py-1 shadow-shadow-sm">
              <Avatar className="size-7">
                <AvatarFallback>{initials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-bold leading-tight">{member.name}</p>
                <p className="text-[10px] text-foreground/50">{ADMIN_ROLE_LABELS[member.role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main id="admin-content" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none sm:p-6">
          {allowed ? children : <PermissionDenied role={ADMIN_ROLE_LABELS[member.role]} />}
        </main>
      </div>
    </div>
  )
}
