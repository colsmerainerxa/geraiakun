import { z } from "zod"

const normalizedNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Profile name must contain at least 2 characters")
      .max(80, "Profile name must contain at most 80 characters"),
  )

const whatsappSchema = z.union([
  z.null(),
  z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .regex(/^\+?[0-9\s-]*$/, "WhatsApp number contains unsupported characters")
        .transform((value) => value.replace(/[\s-]/g, ""))
        .refine(
          (value) => value.length === 0 || /^\+?[0-9]{8,20}$/.test(value),
          "WhatsApp number must contain 8 to 20 digits",
        )
        .transform((value) => value || null),
    ),
])

export const notificationPreferencesSchema = z
  .strictObject({
    orderUpdates: z.boolean(),
    promos: z.boolean(),
    ticketReplies: z.boolean(),
    newsletter: z.boolean(),
  })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one notification preference is required",
  )

const profilePatchSchema = z
  .strictObject({
    name: normalizedNameSchema.optional(),
    whatsapp: whatsappSchema.optional(),
    notifications: notificationPreferencesSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one editable field is required")

export type ProfilePatch = z.infer<typeof profilePatchSchema>
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>

export function parseProfilePatch(input: unknown): ProfilePatch {
  return profilePatchSchema.parse(input)
}
