import { NextResponse } from "next/server";

export async function GET() {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

  const clientId = process.env.GOOGLE_CLIENT_ID || "NOT SET";
  const nextAuthUrl = process.env.NEXTAUTH_URL || "NOT SET";

  return NextResponse.json({
    configured: hasClientId && hasClientSecret && hasNextAuthUrl && hasNextAuthSecret,
    details: {
      hasClientId,
      hasClientSecret,
      hasNextAuthUrl,
      hasNextAuthSecret,
      clientIdPrefix: clientId.substring(0, 20) + "...",
      nextAuthUrl,
      expectedCallbackUrl: `${nextAuthUrl}/api/auth/callback/google`,
    },
    message: hasClientId && hasClientSecret && hasNextAuthUrl && hasNextAuthSecret
      ? "Google OAuth is configured correctly"
      : "Missing required environment variables. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL, and NEXTAUTH_SECRET",
  });
}

