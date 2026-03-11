import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.id_token) {
        try {
          const backendUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL
          const res = await fetch(`${backendUrl}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: account.id_token }),
          })
          if (res.ok) {
            const data = await res.json()
            account.backendToken = data.access_token
            account.backendUser = data.user
            return true
          }
        } catch (e) {
          console.error("Backend auth failed:", e)
        }
      }
      // Allow sign-in even if backend is unavailable in dev
      return true
    },
    async jwt({ token, account }) {
      if (account?.backendToken) {
        token.backendToken = account.backendToken as string
        token.backendUser = account.backendUser
      }
      return token
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string
      session.backendUser = token.backendUser as {
        id: string
        email: string
        name: string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}

declare module "next-auth" {
  interface Session {
    backendToken?: string
    backendUser?: { id: string; email: string; name: string }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string
    backendUser?: { id: string; email: string; name: string }
  }
}
