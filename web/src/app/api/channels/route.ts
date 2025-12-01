import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's channels
    const channels = await prisma.channel.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        handle: true,
        description: true,
        avatarUrl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      channels,
    });
  } catch (error) {
    console.error("Get channels error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get channels" },
      { status: 500 }
    );
  }
}

