"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function subscribeToChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in to subscribe." };
  }

  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return { success: false, message: "Channel not found." };
    }

    // Check if already subscribed
    const existing = await prisma.subscription.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId,
        },
      },
    });

    if (existing) {
      return { success: false, message: "Already subscribed." };
    }

    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        channelId,
      },
    });

    revalidatePath("/subscriptions");
    revalidatePath(`/channel/${channel.handle}`);

    return { success: true, message: "Subscribed successfully!" };
  } catch (error) {
    console.error("Subscribe error:", error);
    return { success: false, message: "Failed to subscribe." };
  }
}

export async function unsubscribeFromChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Please sign in." };
  }

  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return { success: false, message: "Channel not found." };
    }

    await prisma.subscription.deleteMany({
      where: {
        userId: session.user.id,
        channelId,
      },
    });

    revalidatePath("/subscriptions");
    revalidatePath(`/channel/${channel.handle}`);

    return { success: true, message: "Unsubscribed successfully!" };
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return { success: false, message: "Failed to unsubscribe." };
  }
}

