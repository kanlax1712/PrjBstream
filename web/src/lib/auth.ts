import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts,
} from "@/lib/security/account-lockout";
import { sanitizeEmail } from "@/lib/security/sanitize";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-next-auth.session-token" 
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing email or password");
        }

        // Sanitize email
        const sanitizedEmail = sanitizeEmail(credentials.email);

        // Check account lockout
        const lockoutStatus = isAccountLocked(sanitizedEmail);
        if (lockoutStatus.locked) {
          const minutesRemaining = Math.ceil(
            (lockoutStatus.lockedUntil! - Date.now()) / 60000
          );
          throw new Error(
            `Account temporarily locked. Please try again in ${minutesRemaining} minute(s).`
          );
        }

        const user = await prisma.user.findUnique({
          where: { email: sanitizedEmail },
        });

        // Use generic error message to prevent user enumeration
        // Don't reveal whether email exists or not
        if (!user) {
          recordFailedAttempt(sanitizedEmail);
          throw new Error("Invalid email or password");
        }

        const passwordMatch = await compare(
          credentials.password,
          user.passwordHash,
        );

        if (!passwordMatch) {
          recordFailedAttempt(sanitizedEmail);
          const remaining = getRemainingAttempts(sanitizedEmail);
          throw new Error(
            remaining > 0
              ? `Invalid email or password. ${remaining} attempt(s) remaining.`
              : "Invalid email or password"
          );
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(sanitizedEmail);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
      }
      return session;
    },
  },
};

export async function auth() {
  try {
    return await getServerSession(authOptions);
  } catch (error: any) {
    // Handle JWT decryption errors (usually from stale cookies)
    if (error?.message?.includes("decryption") || error?.code === "ERR_JWT_DECRYPTION_FAILED") {
      // Silently return null - the user will need to log in again
      // This happens when NEXTAUTH_SECRET changes or cookies are corrupted
      return null;
    }
    console.error("Error getting session:", error);
    return null;
  }
}

