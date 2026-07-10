import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { serverEnv } from "./env"

function encryptionKey() {
  return createHash("sha256").update(serverEnv.CREDENTIAL_ENCRYPTION_KEY).digest()
}

export function encryptSecret(value: string | null | undefined) {
  if (!value) return null
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".")
}

export function decryptSecret(payload: string | null | undefined) {
  if (!payload) return null
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".")
  if (!ivRaw || !tagRaw || !encryptedRaw) return null
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"))
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}
