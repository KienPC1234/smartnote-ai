import type { NextAuthConfig } from "next-auth"
import prisma from "@/lib/prisma"

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    newUser: "/app",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/app");
      const isOnAuth = nextUrl.pathname.startsWith("/auth");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/app", nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
        if (user) {
            token.id = user.id;
            token.name = user.name;
        }
        // Quan trọng: Xử lý khi Client gọi update()
        if (trigger === "update" && session?.name) {
            token.name = session.name;
        }
        return token;
    },
    async session({ session, token }) {
        if (session.user && token.id) {
            (session.user as any).id = token.id as string;
            session.user.name = token.name as string;
        }
        return session;
    }
  },
  providers: [],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig
