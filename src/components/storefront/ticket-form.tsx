"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "@/i18n/navigation"
import { useTickets } from "@/stores/tickets"
import type { TicketPriority, TicketType } from "@/types"

const schema = z.object({
  type: z.enum(["garansi", "pembayaran", "akun", "lainnya"]),
  subject: z.string().min(5, "min 5"),
  description: z.string().min(10, "min 10"),
  invoice: z.string().optional(),
  priority: z.enum(["rendah", "normal", "tinggi"]),
  customerName: z.string().min(2, "min 2"),
  customerEmail: z.string().email(),
  whatsapp: z.string().min(8, "min 8"),
})

type FormValues = z.input<typeof schema>

const PHONE_PLACEHOLDER = "6281234567890"

/**
 * Form tiket bantuan. Reusable: bila `defaultType` diberikan (mis. dari halaman
 * warranty claim), field jenis disembunyikan & di-prefill. `productId` & nama
 * produk opsional untuk tiket terkait produk tertentu.
 */
export function TicketForm({
  defaultType,
  defaultInvoice,
  title,
  subtitle,
  productId = null,
  productName = null,
  successRedirectToTrack = true,
}: {
  defaultType?: TicketType
  defaultInvoice?: string
  title?: string
  subtitle?: string
  productId?: string | null
  productName?: string | null
  successRedirectToTrack?: boolean
}) {
  const t = useTranslations("warranty")
  const isEn = useLocale() === "en"
  const create = useTickets((s) => s.create)
  const router = useRouter()
  const [createdCode, setCreatedCode] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType ?? "garansi",
      priority: "normal",
      customerName: "",
      customerEmail: "",
      whatsapp: "",
      invoice: defaultInvoice ?? "",
      subject: "",
      description: "",
    },
  })

  const typeVal = watch("type")
  const priorityVal = watch("priority")

  function onSubmit(values: FormValues) {
    const ticket = create({
      type: values.type,
      subject: values.subject,
      description: values.description,
      invoice: values.invoice || null,
      productId,
      productName,
      priority: values.priority as TicketPriority,
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      whatsapp: values.whatsapp,
    })
    setCreatedCode(ticket.code)
    toast.success(`${t("submitted")} ${ticket.code}`)
    reset()
    if (successRedirectToTrack) {
      setTimeout(() => router.push(`/bantuan/tiket?code=${ticket.code}`), 900)
    }
  }

  const typeOptions: { value: TicketType; key: string }[] = [
    { value: "garansi", key: "typeWarranty" },
    { value: "pembayaran", key: "typePayment" },
    { value: "akun", key: "typeAccount" },
    { value: "lainnya", key: "typeOther" },
  ]

  return (
    <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      <div className="mb-5">
        <h2 className="font-heading text-xl font-extrabold">
          {title ?? t("claimTitle")}
        </h2>
        <p className="mt-1 text-sm text-foreground/60">
          {subtitle ?? t("claimSubtitle")}
        </p>
      </div>

      {createdCode && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-base border-2 border-border bg-accent-lime/30 p-3 text-sm">
          <span className="font-bold">{t("submitted")}</span>
          <code className="rounded-base border-2 border-border bg-background px-2 py-0.5 font-heading font-extrabold">
            {createdCode}
          </code>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Type */}
          <div className={defaultType ? "hidden" : "block"}>
            <Label htmlFor="type">{t("type")}</Label>
            <Select
              value={typeVal}
              onValueChange={(v) => setValue("type", v as TicketType)}
            >
              <SelectTrigger id="type" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {t(o.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">{t("priority")}</Label>
            <Select
              value={priorityVal}
              onValueChange={(v) => setValue("priority", v as TicketPriority)}
            >
              <SelectTrigger id="priority" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rendah">{t("priorityLow")}</SelectItem>
                <SelectItem value="normal">{t("priorityNormal")}</SelectItem>
                <SelectItem value="tinggi">{t("priorityHigh")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <Label htmlFor="subject">{t("subject")}</Label>
          <Input
            id="subject"
            placeholder={t("subjectPlaceholder")}
            className="mt-1.5"
            {...register("subject")}
            aria-invalid={!!errors.subject}
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder={t("descriptionPlaceholder")}
            className="mt-1.5"
            {...register("description")}
            aria-invalid={!!errors.description}
          />
        </div>

        {/* Invoice (optional) */}
        <div>
          <Label htmlFor="invoice">{t("invoice")}</Label>
          <Input
            id="invoice"
            placeholder={t("invoicePlaceholder")}
            className="mt-1.5"
            {...register("invoice")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="customerName">
              {isEn ? "Name" : "Nama"}
            </Label>
            <Input
              id="customerName"
              className="mt-1.5"
              {...register("customerName")}
              aria-invalid={!!errors.customerName}
            />
          </div>
          <div>
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              className="mt-1.5"
              {...register("customerEmail")}
              aria-invalid={!!errors.customerEmail}
            />
          </div>
          <div>
            <Label htmlFor="whatsapp">{t("whatsapp")}</Label>
            <Input
              id="whatsapp"
              inputMode="tel"
              placeholder={PHONE_PLACEHOLDER}
              className="mt-1.5"
              {...register("whatsapp")}
              aria-invalid={!!errors.whatsapp}
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full sm:w-auto">
          {t("submit")}
        </Button>
      </form>
    </div>
  )
}
