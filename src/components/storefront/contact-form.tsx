"use client"

import { Clock, Mail, MessageCircle, Send } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ContactForm() {
  const t = useTranslations("static")
  const isEn = useLocale() === "en"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    toast.success(t("contactSent"))
    setName("")
    setEmail("")
    setMessage("")
  }

  const info = [
    {
      icon: Mail,
      accent: "bg-accent-cyan",
      label: isEn ? "Email" : "Email",
      value: "halo@beliakun.id",
    },
    {
      icon: Clock,
      accent: "bg-accent-lime",
      label: isEn ? "Operating Hours" : "Jam Operasional",
      value: isEn ? "Every day, 24 hours" : "Setiap hari, 24 jam",
    },
  ]

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <form
        onSubmit={onSubmit}
        className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow sm:p-8"
      >
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">{t("contactName")}</Label>
            <Input
              id="contact-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEn ? "Your name" : "Nama kamu"}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-email">{t("contactEmail")}</Label>
            <Input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@kamu.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-message">{t("contactMessage")}</Label>
            <Textarea
              id="contact-message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isEn ? "How can we help you?" : "Ada yang bisa kami bantu?"
              }
            />
          </div>
          <Button type="submit" size="lg" className="mt-1 w-full sm:w-fit">
            <Send className="size-4" /> {t("contactSend")}
          </Button>
        </div>
      </form>

      <aside className="flex flex-col gap-4">
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="lime" size="lg" className="w-full">
            <MessageCircle className="size-5" /> {t("contactWa")}
          </Button>
        </a>

        {info.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-base border-2 border-border ${item.accent} shadow-shadow-sm`}
            >
              <item.icon className="size-6" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">
                {item.label}
              </span>
              <span className="font-heading text-base font-bold">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </aside>
    </div>
  )
}
