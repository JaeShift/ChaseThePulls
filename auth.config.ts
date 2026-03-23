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

      // /admin: require sign-in; layout checks ADMIN from DB (JWT role can be stale)
      if (nextUrl.pathname.startsWith("/admin")) {
        if (!isLoggedIn) {
          return Response.redirect(
            new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname + nextUrl.search)}`, nextUrl)
          )
        }
        return true
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


