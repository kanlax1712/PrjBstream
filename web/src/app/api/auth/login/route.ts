import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts,
} from "@/lib/security/account-lockout";
import { sanitizeEmail } from "@/lib/security/sanitize";
import { createApiToken } from "@/lib/auth-api-token";

/**
 * POST /api/auth/login
 * REST login for mobile/native apps. Same validation as NextAuth credentials.
 * Body: { email: string, password: string }
 * Returns: { success: true, user: { id, name, email } } or { success: false, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Please enter both email and password" },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email.toLowerCase());

    const lockoutStatus = isAccountLocked(sanitizedEmail);
    if (lockoutStatus.locked) {
      const minutesRemaining = Math.ceil(
        (lockoutStatus.lockedUntil! - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          success: false,
          message: `Account temporarily locked. Please try again in ${minutesRemaining} minute(s).`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      recordFailedAttempt(sanitizedEmail);
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      recordFailedAttempt(sanitizedEmail);
      return NextResponse.json(
        {
          success: false,
          message:
            "This account was created with social login. Please use Google or another provider to sign in.",
        },
        { status: 401 }
      );
    }

    const passwordMatch = await compare(password, user.passwordHash);

    if (!passwordMatch) {
      recordFailedAttempt(sanitizedEmail);
      const remaining = getRemainingAttempts(sanitizedEmail);
      return NextResponse.json(
        {
          success: false,
          message:
            remaining > 0
              ? `Invalid email or password. ${remaining} attempt(s) remaining.`
              : "Invalid email or password",
        },
        { status: 401 }
      );
    }

    clearFailedAttempts(sanitizedEmail);

    const token = await createApiToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
