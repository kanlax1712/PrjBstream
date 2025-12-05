import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ videoId: string }>;
};

// GET: Get reaction counts and user's reaction
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { videoId } = await params;
    const session = await auth();

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Get reaction counts
    // Use enum values from Prisma
    const [likeCount, dislikeCount] = await Promise.all([
      prisma.videoReaction.count({
        where: { 
          videoId, 
          type: "LIKE" as const,
        },
      }),
      prisma.videoReaction.count({
        where: { 
          videoId, 
          type: "DISLIKE" as const,
        },
      }),
    ]);

    // Get user's reaction if logged in
    let userReaction: "LIKE" | "DISLIKE" | null = null;
    if (session?.user) {
      const reaction = await prisma.videoReaction.findUnique({
        where: {
          videoId_userId: {
            videoId,
            userId: session.user.id,
          },
        },
      });
      userReaction = reaction?.type || null;
    }

    return NextResponse.json({
      likeCount,
      dislikeCount,
      userReaction,
    });
  } catch (error: any) {
    console.error("Error fetching reactions:", error);
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error?.message || "Failed to fetch reactions"
      : "Failed to fetch reactions";
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === "development" ? String(error) : undefined },
      { status: 500 }
    );
  }
}

// POST: Toggle like/dislike
export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { videoId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type } = body; // "LIKE" or "DISLIKE"

    if (!type || (type !== "LIKE" && type !== "DISLIKE")) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    // Check if user already has a reaction
    const existingReaction = await prisma.videoReaction.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId: session.user.id,
        },
      },
    });

    let userReaction: "LIKE" | "DISLIKE" | null = null;
    let likeCount = 0;
    let dislikeCount = 0;

    if (existingReaction) {
      if (existingReaction.type === type) {
        // User clicked the same reaction - remove it
        await prisma.videoReaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
        userReaction = null;
      } else {
        // User switched from like to dislike or vice versa
        await prisma.videoReaction.update({
          where: {
            id: existingReaction.id,
          },
          data: {
            type,
          },
        });
        userReaction = type;
      }
    } else {
      // Create new reaction
      await prisma.videoReaction.create({
        data: {
          videoId,
          userId: session.user.id,
          type,
        },
      });
      userReaction = type;
    }

    // Get updated counts
    [likeCount, dislikeCount] = await Promise.all([
      prisma.videoReaction.count({
        where: { videoId, type: "LIKE" },
      }),
      prisma.videoReaction.count({
        where: { videoId, type: "DISLIKE" },
      }),
    ]);

    return NextResponse.json({
      likeCount,
      dislikeCount,
      userReaction,
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json(
      { error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}

