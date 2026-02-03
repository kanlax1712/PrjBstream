import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSessionFromBearerToken } from "@/lib/auth-api-token";
import { prisma } from "@/lib/prisma";

function getSession(request: NextRequest) {
  return getSessionFromBearerToken(request).then((bearer) =>
    bearer ?? auth()
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const channels = await prisma.channel.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        handle: true,
        description: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, channels });
  } catch (error) {
    console.error("Get channels error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please sign in to create a channel." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const handle = typeof body.handle === "string"
      ? body.handle.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
      : "";
    const description = typeof body.description === "string" ? body.description.trim() || undefined : undefined;

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { success: false, message: "Channel name must be 2–50 characters." },
        { status: 400 }
      );
    }
    if (handle.length < 2 || handle.length > 30) {
      return NextResponse.json(
        { success: false, message: "Handle must be 2–30 characters." },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9-]+$/.test(handle)) {
      return NextResponse.json(
        { success: false, message: "Handle can only contain lowercase letters, numbers, and hyphens." },
        { status: 400 }
      );
    }
    if (description && description.length > 500) {
      return NextResponse.json(
        { success: false, message: "Description must be at most 500 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.channel.findUnique({ where: { handle } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "This handle is already taken. Please choose another." },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        handle,
        description,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        handle: true,
        description: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Channel "${channel.name}" created successfully.`,
      channel,
    });
  } catch (error) {
    console.error("Create channel error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create channel. Please try again." },
      { status: 500 }
    );
  }
}

