import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64
const DUMMY_HASH = `scrypt:${"0".repeat(32)}:${"0".repeat(KEY_LENGTH * 2)}`

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
  return `scrypt:${salt}:${derivedKey.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string | null | undefined) {
  const candidate = storedHash ?? DUMMY_HASH
  const [scheme, salt, hash] = candidate.split(":")
  const validFormat = scheme === "scrypt" && Boolean(salt && hash)
  const safeSalt = validFormat ? salt : "0".repeat(32)
  const safeHash = validFormat ? hash : "0".repeat(KEY_LENGTH * 2)
  const derivedKey = (await scrypt(password, safeSalt, KEY_LENGTH)) as Buffer
  const stored = Buffer.from(safeHash, "hex")
  if (stored.length !== derivedKey.length) return false
  return Boolean(storedHash && validFormat) && timingSafeEqual(stored, derivedKey)
}
