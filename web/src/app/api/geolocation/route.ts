import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";

    // For demo purposes, we'll use a free IP geolocation API
    // In production, you might want to use a paid service like MaxMind
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      const geoData = await geoResponse.json();

      return NextResponse.json({
        success: true,
        location: {
          country: geoData.country_name || "Unknown",
          city: geoData.city || "Unknown",
          region: geoData.region || "Unknown",
          countryCode: geoData.country_code || "Unknown",
          timezone: geoData.timezone || "Unknown",
          location: `${geoData.city || ""}, ${geoData.country_name || ""}`.trim(),
        },
      });
    } catch {
      // Fallback if geolocation fails
      return NextResponse.json({
        success: true,
        location: {
          country: "Unknown",
          city: "Unknown",
          region: "Unknown",
          countryCode: "Unknown",
          timezone: "Unknown",
          location: "Unknown",
        },
      });
    }
  } catch (error) {
    console.error("Geolocation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get location" },
      { status: 500 }
    );
  }
}

