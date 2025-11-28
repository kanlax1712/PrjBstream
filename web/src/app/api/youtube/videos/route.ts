import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-wrapper";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get Google account from database
    const { prisma } = await import("@/lib/prisma");
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Google account not connected. Please sign in with Google.",
        },
        { status: 401 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/api/auth/callback/google"
    );

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token || undefined,
    });

    // Refresh token if expired
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        // Update token in database
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
          },
        });
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return NextResponse.json(
          { 
            success: false, 
            message: "Authentication expired. Please sign in again.",
          },
          { status: 401 }
        );
      }
    }

    // Create YouTube API client
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // Get channel ID first
    const channelResponse = await youtube.channels.list({
      part: ["contentDetails"],
      mine: true,
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No YouTube channel found" },
        { status: 404 }
      );
    }

    const channelId = channelResponse.data.items[0].id;
    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json(
        { success: false, message: "No uploads playlist found" },
        { status: 404 }
      );
    }

    // Get videos from uploads playlist
    const videosResponse = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
    });

    if (!videosResponse.data.items) {
      return NextResponse.json({
        success: true,
        videos: [],
      });
    }

    // Get video details for each video
    const videoIds = videosResponse.data.items
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id);

    const videoDetailsResponse = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: videoIds,
    });

    const videos = (videoDetailsResponse.data.items || []).map((video) => {
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      
      // Parse duration (ISO 8601 format: PT1H2M10S)
      const duration = parseDuration(contentDetails?.duration || "PT0S");
      
      return {
        id: video.id!,
        title: snippet?.title || "Untitled",
        description: snippet?.description || "",
        thumbnailUrl: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || "",
        duration: formatDuration(duration),
        publishedAt: snippet?.publishedAt || new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${video.id}`,
      };
    });

    return NextResponse.json({
      success: true,
      videos,
    });
  } catch (error: any) {
    console.error("YouTube API error:", error);
    
    if (error.code === 401 || error.response?.status === 401) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Google authentication expired. Please sign in again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to fetch YouTube videos",
      },
      { status: 500 }
    );
  }
}

// Helper function to parse ISO 8601 duration
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

