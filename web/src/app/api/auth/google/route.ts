import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { createApiToken } from "@/lib/auth-api-token";

/**
 * POST /api/auth/google
 * REST Google sign-in for mobile/native apps.
 * Body: { idToken: string } — Google ID token from Android/iOS Sign-In
 * Returns: { success: true, user: { id, name, email } } or { success: false, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken =
      typeof body.idToken === "string" ? body.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Missing idToken" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID not configured");
      return NextResponse.json(
        { success: false, message: "Google sign-in is not configured" },
        { status: 503 }
      );
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return NextResponse.json(
        { success: false, message: "Invalid Google token" },
        { status: 401 }
      );
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name ?? payload.email.split("@")[0];
    const image = payload.picture ?? null;
    const providerAccountId = payload.sub;

    // Find or create user + account (same as PrismaAdapter for Google)
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          image,
          passwordHash: null,
        },
      });
    }

    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId,
        },
      },
    });

    if (!account) {
      account = await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId,
          id_token: idToken,
          access_token: null,
          refresh_token: null,
          expires_at: null,
        },
      });
    }

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
    console.error("Google auth API error:", error);
    return NextResponse.json(
      { success: false, message: "Google sign-in failed" },
      { status: 500 }
    );
  }
}
