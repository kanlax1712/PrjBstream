#!/usr/bin/env node
/**
 * Upload sample videos directly to Vercel database
 * Uses Prisma to insert videos directly (faster than API uploads)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Free sample videos from Google Cloud Storage (public, free to use)
// Using data URI thumbnails for better compatibility
const PLACEHOLDER_THUMBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2306b6d4;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%233b82f6;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='32' fill='white' text-anchor='middle' dominant-baseline='middle'%3EVideo Thumbnail%3C/text%3E%3C/svg%3E";

const SAMPLE_VIDEOS = [
  {
    title: "Big Buck Bunny - Open Source Movie",
    description: "A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness. This is a free, open-source animated short film perfect for testing video playback.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2306b6d4'/%3E%3Cstop offset='100%25' style='stop-color:%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EBig Buck Bunny%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E10 min • Animation%3C/text%3E%3C/svg%3E",
    duration: 596,
    tags: "animation,open-source,free,creative-commons,test",
  },
  {
    title: "Elephants Dream - Blender Foundation",
    description: "The first open movie project made with free software tools. A story about two strange characters exploring a surreal, futuristic world. Perfect for testing video streaming.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%233b82f6'/%3E%3Cstop offset='100%25' style='stop-color:%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EElephants Dream%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E11 min • Sci-Fi%3C/text%3E%3C/svg%3E",
    duration: 653,
    tags: "blender,3d-animation,open-source,sci-fi,test",
  },
  {
    title: "Sintel - Blender Open Movie",
    description: "A fantasy action adventure about a young woman searching for her lost dragon companion. Created entirely with open-source software. Great for testing video quality settings.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238b5cf6'/%3E%3Cstop offset='100%25' style='stop-color:%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3ESintel%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E15 min • Fantasy%3C/text%3E%3C/svg%3E",
    duration: 888,
    tags: "fantasy,adventure,blender,open-source,test",
  },
  {
    title: "Tears of Steel - Blender Foundation",
    description: "A science fiction short film about a group of warriors and scientists who gather at the Oude Kerk in a future Amsterdam to stage a crucial event. Excellent for testing video player features.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f59e0b'/%3E%3Cstop offset='100%25' style='stop-color:%23ef4444'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3ETears of Steel%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E12 min • Action%3C/text%3E%3C/svg%3E",
    duration: 734,
    tags: "sci-fi,action,blender,amsterdam,test",
  },
  {
    title: "For Bigger Blazes - Test Video",
    description: "A high-quality test video featuring dynamic scenes perfect for testing video playback, streaming, and quality settings. Short format ideal for quick testing.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ef4444'/%3E%3Cstop offset='100%25' style='stop-color:%23dc2626'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EFor Bigger Blazes%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E15 sec • Test Video%3C/text%3E%3C/svg%3E",
    duration: 15,
    tags: "test-video,short-format,quality-test",
  },
  {
    title: "For Bigger Escapes - Adventure Content",
    description: "An exciting adventure test video showcasing various scenes and landscapes. Perfect for testing video player features and streaming capabilities.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2310b981'/%3E%3Cstop offset='100%25' style='stop-color:%23059669'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EFor Bigger Escapes%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E15 sec • Adventure%3C/text%3E%3C/svg%3E",
    duration: 15,
    tags: "adventure,landscape,test-video",
  },
];

async function main() {
  console.log("🚀 Starting video upload to Vercel database...\n");

  try {
    // Get or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: "creator@bstream.dev" },
    });

    if (!testUser) {
      console.log("👤 Creating test user 'creator@bstream.dev'...");
      const passwordHash = await bcrypt.hash("watchmore", 10);
      testUser = await prisma.user.create({
        data: {
          email: "creator@bstream.dev",
          name: "Bstream Creator",
          passwordHash,
          bio: "Creator account for sample videos",
          image: "https://api.dicebear.com/9.x/initials/svg?seed=Bstream",
        },
      });
      console.log(`✅ Created user: ${testUser.name}\n`);
    }

    console.log(`✅ Found user: ${testUser.name} (${testUser.email})\n`);

    // Get or create channel
    let channel = await prisma.channel.findFirst({
      where: { ownerId: testUser.id },
    });

    if (!channel) {
      console.log("📺 Creating channel for user...");
      channel = await prisma.channel.create({
        data: {
          name: `${testUser.name}'s Channel`,
          handle: testUser.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 20),
          description: "Channel for sample videos",
          ownerId: testUser.id,
        },
      });
      console.log(`✅ Created channel: ${channel.name}\n`);
    } else {
      console.log(`✅ Using existing channel: ${channel.name}\n`);
    }

    // Upload videos
    console.log(`📹 Uploading ${SAMPLE_VIDEOS.length} sample videos...\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < SAMPLE_VIDEOS.length; i++) {
      const video = SAMPLE_VIDEOS[i];
      console.log(`[${i + 1}/${SAMPLE_VIDEOS.length}] ${video.title}`);

      try {
        // Check if video already exists
        const existing = await prisma.video.findUnique({
          where: { videoUrl: video.videoUrl },
        });

        if (existing) {
          console.log(`   ⏭️  Already exists, skipping...\n`);
          skipCount++;
          continue;
        }

        // Create video
        await prisma.video.create({
          data: {
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            tags: video.tags,
            status: "READY",
            visibility: "PUBLIC",
            hasAds: false,
            publishedAt: new Date(Date.now() - (SAMPLE_VIDEOS.length - i) * 1000 * 60 * 60 * 24), // Stagger publish dates
            channelId: channel.id,
          },
        });

        console.log(`   ✅ Uploaded successfully!\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }

    console.log("=".repeat(50));
    console.log(`✅ Upload Complete!`);
    console.log(`   Successfully uploaded: ${successCount}`);
    console.log(`   Skipped (already exists): ${skipCount}`);
    console.log(`   Total: ${SAMPLE_VIDEOS.length}`);
    console.log("=".repeat(50));
    console.log(`\n🌐 Videos are now available on your Vercel deployment!`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

