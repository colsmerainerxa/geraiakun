"use client"

import {
  Check,
  Copy,
  KeyRound,
  LockKeyhole,
  MailPlus,
  MoreHorizontal,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { StatCard } from "@/components/admin/parts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, initials } from "@/lib/utils"
import { ADMIN_ROLE_LABELS, ROLE_PERMISSIONS } from "@/stores/enterprise-admin"
import { useAdminTeam } from "@/lib/api/queries"
import { useQueryClient } from "@tanstack/react-query"
import type { AdminRole } from "@/types"

const ROLES = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]
const RECOVERY_CODES = ["BK-29PX-7QAW", "BK-J4MN-82LC", "BK-6TVD-1RKE", "BK-W9HF-53ZU"]

export function AdminTeamView() {
  const queryClient = useQueryClient()
  const { data: staff = [] as any[] } = useAdminTeam()
  const activeStaffId = ""
  const [inviteOpen, setInviteOpen] = useState(false)
  const [securityId, setSecurityId] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AdminRole>("operations")

  async function inviteStaff(input: { name: string; email: string; role: AdminRole }) {
    const r = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (r.ok) {
      queryClient.invalidateQueries({ queryKey: ["admin", "team"] })
      toast.success("Anggota tim diundang")
    }
  }
  async function updateStaff(id: string, patch: Record<string, unknown>) {
    const r = await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    })
    if (r.ok) {
      queryClient.invalidateQueries({ queryKey: ["admin", "team"] })
    }
  }

  const stats = useMemo(
    () => ({
      active: staff.filter((member: any) => member.status === "active").length,
      invited: staff.filter((member: any) => member.status === "invited").length,
      twoFactor: staff.filter((member: any) => member.twoFactorEnabled).length,
      roles: new Set(staff.map((member: any) => member.role)).size,
    }),
    [staff],
  )
  const securityMember = staff.find((member: any) => member.id === securityId)

  function submitInvite() {
    if (name.trim().length < 2 || !email.includes("@")) {
      toast.error("Nama dan email staf wajib diisi dengan benar")
      return
    }
    inviteStaff({ name: name.trim(), email: email.trim(), role })
    setInviteOpen(false)
    setName("")
    setEmail("")
    toast.success("Undangan staf dibuat")
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold">Tim & Role</h2>
          <p className="text-sm text-foreground/60">
            Kelola akses staf, role tetap, 2FA, dan status undangan.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <MailPlus className="size-4" /> Undang Staf
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Staf Aktif" value={stats.active} icon={Users} accent="bg-accent-cyan" />
        <StatCard label="Undangan" value={stats.invited} icon={MailPlus} accent="bg-warning" />
        <StatCard
          label="2FA Aktif"
          value={`${stats.twoFactor}/${staff.length}`}
          icon={ShieldCheck}
          accent="bg-accent-lime"
        />
        <StatCard
          label="Role Digunakan"
          value={stats.roles}
          icon={UserCog}
          accent="bg-accent-purple"
        />
      </div>

      <section className="min-w-0 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b-2 border-border bg-main px-5 py-3 text-xs font-extrabold uppercase md:grid">
          <span>Staf</span>
          <span>Role</span>
          <span>Status</span>
          <span>Keamanan</span>
          <span>Aksi</span>
        </div>
        <div className="divide-y-2 divide-border">
          {staff.map((member: any) => (
            <div
              key={member.id}
              className="grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-bold">{member.name}</p>
                  <p className="truncate text-xs text-foreground/55">{member.email}</p>
                  {member.lastActiveAt && (
                    <p className="text-[11px] text-foreground/40">
                      Aktif {formatDate(member.lastActiveAt)}
                    </p>
                  )}
                </div>
              </div>
              <Select
                value={member.role}
                onValueChange={(value) => updateStaff(member.id, { role: value as AdminRole })}
                disabled={member.id === activeStaffId}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ADMIN_ROLE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <Badge
                  variant={
                    member.status === "active"
                      ? "success"
                      : member.status === "invited"
                        ? "warning"
                        : "danger"
                  }
                >
                  {member.status}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setSecurityId(member.id)}
                className="flex items-center gap-2 text-left text-sm font-bold hover:text-accent-pink"
              >
                {member.twoFactorEnabled ? (
                  <ShieldCheck className="size-4 text-success" />
                ) : (
                  <LockKeyhole className="size-4 text-warning" />
                )}
                {member.twoFactorEnabled ? "2FA aktif" : "Setup 2FA"}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="neutral" aria-label={`Aksi ${member.name}`}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      updateStaff(member.id, {
                        status: member.status === "suspended" ? "active" : "suspended",
                      })
                    }
                    disabled={member.id === activeStaffId}
                  >
                    {member.status === "suspended" ? "Aktifkan kembali" : "Suspend akses"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSecurityId(member.id)}>
                    Kelola keamanan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <h2 className="font-heading text-lg font-extrabold">Matriks Izin Role Tetap</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Role dibuat tetap agar implementasi backend tidak membutuhkan custom policy builder.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {ROLES.map((value) => (
            <div key={value} className="rounded-base border-2 border-border bg-background p-4">
              <p className="font-heading text-sm font-extrabold">{ADMIN_ROLE_LABELS[value]}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {ROLE_PERMISSIONS[value].map((permission) => (
                  <li
                    key={permission}
                    className="flex items-start gap-2 text-xs font-semibold text-foreground/65"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undang Staf</DialogTitle>
            <DialogDescription>
              Undangan mock akan masuk ke daftar dengan status invited.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="staff-name">Nama</Label>
              <Input
                id="staff-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="staff-email">Email kerja</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ADMIN_ROLE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setInviteOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitInvite}>Kirim Undangan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(securityMember)} onOpenChange={(open) => !open && setSecurityId("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keamanan {securityMember?.name}</DialogTitle>
            <DialogDescription>
              Pratinjau enrollment 2FA dan recovery codes sebelum backend autentikasi tersedia.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="grid aspect-square grid-cols-7 gap-1 border-4 border-border bg-background p-3">
              {Array.from({ length: 49 }, (_, index) => (
                <span
                  key={index}
                  className={(index * 7 + 3) % 5 < 2 ? "bg-foreground" : "bg-transparent"}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-bold">Scan dengan authenticator</p>
              <code className="mt-2 block rounded-base border-2 border-border bg-background p-3 text-xs">
                GERAIAKUN-{securityMember?.id.toUpperCase()}
              </code>
              <p className="mt-3 text-xs font-bold text-foreground/50">Recovery codes</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {RECOVERY_CODES.map((code) => (
                  <code
                    key={code}
                    className="rounded-base border-2 border-dashed border-border p-2 text-[11px]"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  void navigator.clipboard?.writeText(RECOVERY_CODES.join("\n"))
                  toast.success("Recovery codes disalin")
                }}
              >
                <Copy className="size-4" /> Salin kode
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setSecurityId("")}>
              <X className="size-4" /> Tutup
            </Button>
            <Button
              onClick={() => {
                if (securityMember)
                  updateStaff(securityMember.id, {
                    twoFactorEnabled: !securityMember.twoFactorEnabled,
                  })
                setSecurityId("")
                toast.success("Status 2FA diperbarui")
              }}
            >
              <KeyRound className="size-4" />{" "}
              {securityMember?.twoFactorEnabled ? "Nonaktifkan 2FA" : "Aktifkan 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
