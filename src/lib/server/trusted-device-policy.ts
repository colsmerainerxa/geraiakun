import { z } from "zod"

const deviceMutationSchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("one"), deviceId: z.string().min(1).max(128) }),
  z.strictObject({ mode: z.literal("all") }),
])

export function parseDeviceMutation(input: unknown) {
  return deviceMutationSchema.parse(input)
}
