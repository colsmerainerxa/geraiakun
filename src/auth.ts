import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { verifyPassword } from "@/lib/server/password"
import { prisma } from "@/lib/server/prisma"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

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
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(rawCredentials) {
      const parsed = credentialsSchema.safeParse(rawCredentials)
      if (!parsed.success) return null

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      })
      const valid = await verifyPassword(parsed.data.password, user?.passwordHash)
      if (!user || !valid) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role === "ADMIN" ? "admin" : "customer",
      }
    },
  }),
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as never),
  session: { strategy: "jwt" },
  secret: serverEnv.AUTH_SECRET,
  trustHost: true,
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user.id || !user.email) return true
      await prisma.customerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          avatar: user.image,
        },
      })
      return true
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        token.role = user.role ?? "customer"
      }
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        })
        token.id = dbUser?.id ?? token.id
        token.role = dbUser?.role === "ADMIN" ? "admin" : "customer"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "")
        session.user.role = token.role === "admin" ? "admin" : "customer"
      }
      return session
    },
  },
})
