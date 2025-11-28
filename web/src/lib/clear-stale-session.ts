/**
 * Client-side utility to clear stale NextAuth cookies
 * Call this if you're experiencing JWT decryption errors
 */
export function clearStaleSession() {
  if (typeof window === "undefined") return;
  
  // List of NextAuth cookie names
  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ];
  
  // Clear all NextAuth cookies
  cookieNames.forEach((name) => {
    // Clear for current path
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Clear for root path
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    // Clear without domain
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;`;
  });
  
  // Also clear all cookies that start with next-auth
  const allCookies = document.cookie.split(";");
  allCookies.forEach((cookie) => {
    const cookieName = cookie.split("=")[0].trim();
    if (cookieName.includes("next-auth") || cookieName.includes("authjs")) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    }
  });
  
  // Reload the page to apply changes
  window.location.reload();
}

