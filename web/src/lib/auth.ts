import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Facebook from "next-auth/providers/facebook";
import Instagram from "next-auth/providers/instagram";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts,
} from "@/lib/security/account-lockout";
import { sanitizeEmail } from "@/lib/security/sanitize";

// Initialize adapter - required for OAuth account linking
// If this fails, OAuth won't work but credentials login will still work
let adapter: Adapter | undefined;
try {
  adapter = PrismaAdapter(prisma) as Adapter;
  console.log("✅ PrismaAdapter initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize PrismaAdapter:", error);
  console.error("OAuth providers will not work without adapter");
  // Adapter is optional with JWT strategy, but needed for OAuth account linking
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
  // Suppress JWT decryption errors in logs (they're handled gracefully)
  logger: {
    error: (error: Error) => {
      // Don't log JWT decryption errors - they're expected for stale cookies
      if (error.name === "JWTSessionError" || error.message?.includes("decryption")) {
        return; // Silently ignore
      }
      console.error("[auth][error]", error);
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true, // Required for Vercel and some hosting providers
  pages: {
    signIn: "/login",
    signOut: "/",
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
    // Google OAuth (only if credentials are provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
                access_type: "offline",
                prompt: "consent",
              },
            },
            checks: ["pkce", "state"],
          }),
        ]
      : []),
    // Microsoft OAuth (only if credentials are provided)
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ? [
          MicrosoftEntraID({
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          }),
        ]
      : []),
    // Facebook OAuth (only if credentials are provided)
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
    // Instagram OAuth (only if credentials are provided)
    ...(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET
      ? [
          Instagram({
            clientId: process.env.INSTAGRAM_CLIENT_ID,
            clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
          }),
        ]
      : []),
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
        const sanitizedEmail = sanitizeEmail(credentials.email as string);

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

        // OAuth users don't have passwordHash
        if (!user.passwordHash) {
          recordFailedAttempt(sanitizedEmail);
          throw new Error("Invalid email or password. This account was created with social login. Please use Google/Microsoft/Facebook/Instagram to sign in.");
        }

        const passwordMatch = await compare(
          credentials.password as string,
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
    async jwt({ token, user, account, trigger }) {
      try {
        if (user) {
          token.id = user.id;
          token.name = user.name;
        }
        
        // Store OAuth account info for YouTube API access
        if (account?.provider === "google" && account.access_token) {
          token.googleAccessToken = account.access_token;
          token.googleRefreshToken = account.refresh_token;
          
          // Explicitly save account to database if adapter is available
          // This ensures the account is saved even with JWT strategy
          if (adapter && user?.id) {
            try {
              // Check if account already exists
              const existingAccount = await prisma.account.findUnique({
                where: {
                  provider_providerAccountId: {
                    provider: "google",
                    providerAccountId: account.providerAccountId,
                  },
                },
              });
              
              if (!existingAccount) {
                // Create account if it doesn't exist
                await prisma.account.create({
                  data: {
                    userId: user.id,
                    type: account.type,
                    provider: "google",
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    refresh_token: account.refresh_token || null,
                    expires_at: account.expires_at || null,
                    token_type: account.token_type || null,
                    scope: account.scope || null,
                    id_token: account.id_token || null,
                    session_state: account.session_state || null,
                  },
                });
                console.log("✅ Google account saved to database");
              } else {
                // Update existing account with new tokens
                await prisma.account.update({
                  where: { id: existingAccount.id },
                  data: {
                    access_token: account.access_token,
                    refresh_token: account.refresh_token || existingAccount.refresh_token,
                    expires_at: account.expires_at || existingAccount.expires_at,
                    token_type: account.token_type || existingAccount.token_type,
                    scope: account.scope || existingAccount.scope,
                    id_token: account.id_token || existingAccount.id_token,
                  },
                });
                console.log("✅ Google account tokens updated in database");
              }
            } catch (dbError) {
              console.error("❌ Failed to save Google account to database:", dbError);
              // Don't block the auth flow if account save fails
            }
          }
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = (token.name as string | undefined) || session.user.name;
          // Add OAuth tokens for API access
          if (token.googleAccessToken) {
            (session as any).googleAccessToken = token.googleAccessToken;
            (session as any).googleRefreshToken = token.googleRefreshToken;
          }
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
    async signIn({ user, account, profile }) {
      try {
        // Allow all sign-ins, but log for debugging
        if (account?.provider === "google") {
          console.log("✅ Google OAuth sign-in:", user.email);
          console.log("✅ Account data:", {
            provider: account.provider,
            hasAccessToken: !!account.access_token,
            hasRefreshToken: !!account.refresh_token,
          });
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        // Don't block sign-in on callback errors
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects properly, especially for YouTube import flow
      console.log("🔄 Redirect callback:", { url, baseUrl });
      
      // If URL is relative, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If URL is on same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to base URL
      return baseUrl;
    },
  },
});

