import type { NextAuthConfig } from "next-auth"

// This config is used in middleware (Edge runtime - no Prisma allowed)
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdmin = (auth?.user as any)?.role === "ADMIN"

      if (nextUrl.pathname.startsWith("/admin")) {
        return isLoggedIn && isAdmin
      }
      if (nextUrl.pathname.startsWith("/account")) {
        if (!isLoggedIn) {
          return Response.redirect(
            new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl)
          )
        }
      }
      return true
    },
  },
}


