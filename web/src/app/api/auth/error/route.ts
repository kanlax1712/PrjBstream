import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get("error");
    
    // Log the error for debugging
    console.error("NextAuth OAuth error:", error);
    
    // Get the base URL
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "http://localhost:3000";
    
    // Redirect to login page with error parameter
    const loginUrl = `${baseUrl}/login?error=${encodeURIComponent(error || "Configuration")}`;
    
    return NextResponse.redirect(loginUrl);
  } catch (error: any) {
    console.error("Error route handler failed:", error);
    // Fallback redirect
    return NextResponse.redirect(new URL("/login?error=Configuration", request.url));
  }
}

