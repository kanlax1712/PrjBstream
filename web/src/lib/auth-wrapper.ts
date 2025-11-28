/**
 * Wrapper for auth() function that handles errors gracefully
 * This prevents JWT errors from crashing the app
 */
import { auth } from "./auth";

export async function getSession() {
  try {
    const session = await auth();
    return session;
  } catch (error: any) {
    // Handle JWT decryption errors (usually from stale cookies)
    // These errors occur when:
    // 1. NEXTAUTH_SECRET changed
    // 2. Cookies are corrupted/stale
    // 3. Cookies were encrypted with a different secret
    const errorMessage = error?.message || "";
    const errorName = error?.name || "";
    const errorCode = error?.code || "";
    const errorCause = error?.cause?.message || "";
    
    const isJWTError = 
      errorMessage.includes("decryption") ||
      errorMessage.includes("JWEDecryptionFailed") ||
      errorCode === "ERR_JWT_DECRYPTION_FAILED" ||
      errorName === "JWTSessionError" ||
      errorCause.includes("decryption") ||
      errorCause.includes("JWEDecryptionFailed");
    
    if (isJWTError) {
      // Silently return null - the user will need to log in again
      // Don't log this as it's expected behavior for stale cookies
      return null;
    }
    
    // Only log non-JWT errors
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting session:", error);
    }
    return null;
  }
}

