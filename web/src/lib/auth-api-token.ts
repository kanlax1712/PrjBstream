import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production"
);
const TOKEN_EXPIRY = "30d";

export type ApiSessionUser = { id: string; email: string; name: string };

/**
 * Create a JWT for mobile/native clients. Return this in login and Google auth responses.
 */
export async function createApiToken(user: ApiSessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET);
}

/**
 * Get session from Authorization: Bearer <token>. Use in API routes that mobile calls.
 * Returns null if no valid Bearer token.
 */
export async function getSessionFromBearerToken(
  request: NextRequest
): Promise<{ user: ApiSessionUser } | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const sub = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    if (!sub) return null;
    return { user: { id: sub, email, name } };
  } catch {
    return null;
  }
}
