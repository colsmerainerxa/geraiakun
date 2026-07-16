import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { consumeLoginGrant } from "@/lib/server/account-tokens"
import { parseLoginGrantCredentials, sessionIsCurrent } from "@/lib/server/auth-flows"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const providers: NextAuthConfig["providers"] = [
  ...(backendFlags.googleConfigured
    ? [
        Google({
          clientId: serverEnv.AUTH_GOOGLE_ID,
          clientSecret: serverEnv.AUTH_GOOGLE_SECRET,
        }),
      ]
    : []),
  Credentials({
    name: "Email grant",
    credentials: {
      grant: { label: "Login grant", type: "text" },
    },
    async authorize(rawCredentials) {
      let parsed: ReturnType<typeof parseLoginGrantCredentials>
      try {
        parsed = parseLoginGrantCredentials({ grant: rawCredentials?.grant })
      } catch {
        return null
      }
      const user = await consumeLoginGrant(parsed.grant)
      if (!user?.emailVerified) return null
      if (user.role === "ADMIN" && user.adminStaff?.status !== "active") return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role === "ADMIN" ? "admin" : "customer",
        sessionVersion: user.sessionVersion,
      }
    },
  }),
]

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma as never),
  session: { strategy: "jwt" },
  secret: serverEnv.AUTH_SECRET,
  trustHost: true,
  providers,
  logger: {
    error(error) {
      if (error instanceof CredentialsSignin) return
      console.error("[auth][error]", error.name, error.message)
    },
    warn(code) {
      console.warn("[auth][warning]", code)
    },
    debug() {},
  },
  events: {
    async createUser({ user }) {
      if (!user.id) throw new Error("Auth adapter created a user without an ID")
      await prisma.customerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, avatar: user.image },
      })
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        token.role = user.role ?? "customer"
        token.sessionVersion = user.sessionVersion
        token.invalidated = false
      }

      const userId = String(token.id ?? user?.id ?? "")
      const dbUser = userId
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              sessionVersion: true,
              adminStaff: { select: { status: true } },
            },
          })
        : token.email
          ? await prisma.user.findUnique({
              where: { email: token.email },
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                sessionVersion: true,
                adminStaff: { select: { status: true } },
              },
            })
          : null

      const tokenSessionVersion =
        typeof token.sessionVersion === "number" ? token.sessionVersion : undefined
      const accountEnabled = dbUser?.role !== "ADMIN" || dbUser.adminStaff?.status === "active"
      if (
        !dbUser ||
        !accountEnabled ||
        !sessionIsCurrent(tokenSessionVersion, dbUser.sessionVersion)
      ) {
        token.id = ""
        token.invalidated = true
        return token
      }

      token.id = dbUser.id
      token.name = dbUser.name
      token.email = dbUser.email
      token.picture = dbUser.image
      token.role = dbUser.role === "ADMIN" ? "admin" : "customer"
      token.sessionVersion = dbUser.sessionVersion
      token.invalidated = false
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.invalidated ? "" : String(token.id ?? "")
        session.user.role = token.role === "admin" ? "admin" : "customer"
      }
      return session
    },
  },
})
