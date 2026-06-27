"use client"

import type { LucideIcon } from "lucide-react"
import {
  KeyRound,
  LayoutDashboard,
  Menu,
  MessageCircleQuestion,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Ticket,
  Users,
} from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produk", label: "Produk", icon: Package },
  { href: "/admin/pesanan", label: "Pesanan", icon: ShoppingBag },
  { href: "/admin/pelanggan", label: "Pelanggan", icon: Users },
  { href: "/admin/transaksi", label: "Transaksi", icon: Receipt },
  { href: "/admin/promo", label: "Promo", icon: Ticket },
  { href: "/admin/stok", label: "Stok Akun", icon: KeyRound },
  { href: "/admin/tiket", label: "Tiket Bantuan", icon: MessageCircleQuestion },
  { href: "/admin/ulasan", label: "Ulasan & Tanya", icon: Star },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useActive()
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-base border-2 px-3.5 py-2.5 font-heading text-sm font-bold transition-all",
              active
                ? "border-border bg-main text-main-foreground shadow-shadow-sm"
                : "border-transparent text-foreground/70 hover:border-border hover:bg-secondary-background",
            )}
          >
            <item.icon className="size-4.5" />
            {item.label}
          </Link>
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
      <span className="font-heading text-lg font-extrabold tracking-tight">
        beli<span className="text-accent-pink">akun</span>
        <span className="ml-1 align-top text-[10px] font-bold uppercase text-foreground/50">
          admin
        </span>
      </span>
    </Link>
  )
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      <Link
        href="/"
        onClick={onNavigate}
        className="mt-auto flex items-center gap-3 rounded-base border-2 border-transparent px-3.5 py-2.5 font-heading text-sm font-bold text-foreground/70 transition-all hover:border-border hover:bg-secondary-background"
      >
        <Store className="size-4.5" /> Kembali ke Toko
      </Link>
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const title =
    NAV.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)))
      ?.label ?? "Dashboard"

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r-2 border-border bg-background p-5 lg:block">
        <SidebarInner />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-2 border-border bg-background/90 px-4 backdrop-blur sm:px-6">
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
                <SheetTitle className="sr-only">Menu Admin</SheetTitle>
              </SheetHeader>
              <SidebarInner onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1 className="font-heading text-xl font-extrabold">{title}</h1>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-2 py-1 shadow-shadow-sm">
              <Avatar className="size-7">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-bold sm:inline">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
