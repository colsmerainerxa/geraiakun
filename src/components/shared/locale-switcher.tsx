"use client"

import { useParams } from "next/navigation"
import { useLocale } from "next-intl"
import { useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇬🇧" },
]

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  function onSelect(next: Locale) {
    startTransition(() => {
      // @ts-expect-error -- params type is generic
      router.replace({ pathname, params }, { locale: next })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="flex h-9 items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-2.5 font-heading text-sm font-bold transition-all hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-60"
        aria-label="Ganti bahasa"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="uppercase">{current.code}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => onSelect(l.code)}>
            <span className="text-base">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
