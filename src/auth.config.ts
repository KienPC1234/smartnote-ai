import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  trustHost: true,
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
            console.log("[DEBUG][JWT] User signed in, setting token.id:", user.id);
            token.id = user.id;
            token.name = user.name;
        }
        // Quan trọng: Xử lý khi Client gọi update()
        if (trigger === "update" && session?.name) {
            console.log("[DEBUG][JWT] Update trigger, setting token.name:", session.name);
            token.name = session.name;
        }
        return token;
    },
    async session({ session, token }) {
        if (session.user && token.id) {
            console.log("[DEBUG][SESSION] Setting session.user.id from token:", token.id);
            (session.user as any).id = token.id as string;
            session.user.name = token.name as string;
        }
        return session;
    }
  },
  providers: [],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig
