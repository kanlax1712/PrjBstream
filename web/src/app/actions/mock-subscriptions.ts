"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createMockSubscriptions() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in." };
  }

  try {
    // Get all channels except user's own
    const userChannel = await prisma.channel.findFirst({
      where: { ownerId: session.user.id },
    });

    const channels = await prisma.channel.findMany({
      where: userChannel
        ? { id: { not: userChannel.id } }
        : undefined,
      take: 5, // Subscribe to 5 random channels
    });

    if (channels.length === 0) {
      return {
        success: false,
        message: "No channels available to subscribe to.",
      };
    }

    // Get existing subscriptions
    const existingSubs = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      select: { channelId: true },
    });

    const existingChannelIds = new Set(existingSubs.map((s) => s.channelId));

    // Create subscriptions for channels not already subscribed
    const newSubscriptions = channels
      .filter((ch) => !existingChannelIds.has(ch.id))
      .slice(0, 5);

    if (newSubscriptions.length === 0) {
      return {
        success: true,
        message: "You're already subscribed to available channels.",
      };
    }

    await prisma.subscription.createMany({
      data: newSubscriptions.map((channel) => ({
        userId: session.user.id!,
        channelId: channel.id,
      })),
    });

    revalidatePath("/subscriptions");

    return {
      success: true,
      message: `Subscribed to ${newSubscriptions.length} channels!`,
    };
  } catch (error) {
    console.error("Create mock subscriptions error:", error);
    return { success: false, message: "Failed to create subscriptions." };
  }
}

