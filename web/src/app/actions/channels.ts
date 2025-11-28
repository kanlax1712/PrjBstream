"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const channelSchema = z.object({
  name: z.string().min(2).max(50),
  handle: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, "Handle can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
});

export async function createChannel(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Please sign in to create a channel." };
    }

    // Allow users to create multiple channels - removed restriction

    const name = formData.get("name");
    const handle = formData.get("handle");
    const description = formData.get("description");

    const fields = {
      name: String(name),
      handle: String(handle).toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      description: description ? String(description) : undefined,
    };

    const parsed = channelSchema.safeParse(fields);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        message: firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Invalid form data",
      };
    }

    // Check if handle is already taken
    const handleExists = await prisma.channel.findUnique({
      where: { handle: parsed.data.handle },
    });

    if (handleExists) {
      return { success: false, message: "This handle is already taken. Please choose another." };
    }

    const channel = await prisma.channel.create({
      data: {
        name: parsed.data.name,
        handle: parsed.data.handle,
        description: parsed.data.description,
        ownerId: session.user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/studio");

    return {
      success: true,
      message: `Channel "${channel.name}" created successfully!`,
      channelId: channel.id,
    };
  } catch (error) {
    console.error("Create channel error:", error);
    return { success: false, message: "Failed to create channel. Please try again." };
  }
}

