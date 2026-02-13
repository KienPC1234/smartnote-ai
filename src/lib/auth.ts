import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
            console.log("[DEBUG][AUTH] Authorize started for:", credentials?.email);
            if (!credentials?.email || !credentials?.password) {
                console.log("[DEBUG][AUTH] Missing credentials");
                return null;
            }

            const user = await prisma.user.findUnique({
              where: { email: credentials.email as string },
            });

            if (!user) {
                console.log("[DEBUG][AUTH] User not found:", credentials.email);
                return null;
            }
            
            if (!user.passwordHash) {
                console.log("[DEBUG][AUTH] User has no password hash (maybe social login only):", credentials.email);
                return null;
            }

            const isValid = await bcrypt.compare(
              credentials.password as string,
              user.passwordHash
            );

            if (!isValid) {
                console.log("[DEBUG][AUTH] Invalid password for:", credentials.email);
                return null;
            }

            console.log("[DEBUG][AUTH] Authorize success for:", user.email);
            return {
                id: user.id,
                email: user.email,
                name: user.name,
            };
        } catch (error) {
            console.error("[DEBUG][AUTH] Authorize error:", error);
            return null;
        }
      },
    }),
  ],
});
