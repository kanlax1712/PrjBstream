#!/usr/bin/env node
/**
 * Upload sample videos directly to Vercel database
 * Uses Prisma to insert videos directly (faster than API uploads)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Free sample videos from Google Cloud Storage (public, free to use)
const SAMPLE_VIDEOS = [
  {
    title: "Big Buck Bunny - Open Source Movie",
    description: "A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness. This is a free, open-source animated short film perfect for testing video playback.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/06b6d4/ffffff?text=Big+Buck+Bunny",
    duration: 596, // ~10 minutes
    tags: "animation,open-source,free,creative-commons,test",
  },
  {
    title: "Elephants Dream - Blender Foundation",
    description: "The first open movie project made with free software tools. A story about two strange characters exploring a surreal, futuristic world. Perfect for testing video streaming.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/3b82f6/ffffff?text=Elephants+Dream",
    duration: 653, // ~11 minutes
    tags: "blender,3d-animation,open-source,sci-fi,test",
  },
  {
    title: "Sintel - Blender Open Movie",
    description: "A fantasy action adventure about a young woman searching for her lost dragon companion. Created entirely with open-source software. Great for testing video quality settings.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/8b5cf6/ffffff?text=Sintel",
    duration: 888, // ~15 minutes
    tags: "fantasy,adventure,blender,open-source,test",
  },
  {
    title: "Tears of Steel - Blender Foundation",
    description: "A science fiction short film about a group of warriors and scientists who gather at the Oude Kerk in a future Amsterdam to stage a crucial event. Excellent for testing video player features.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/f59e0b/ffffff?text=Tears+of+Steel",
    duration: 734, // ~12 minutes
    tags: "sci-fi,action,blender,amsterdam,test",
  },
  {
    title: "For Bigger Blazes - Test Video",
    description: "A high-quality test video featuring dynamic scenes perfect for testing video playback, streaming, and quality settings. Short format ideal for quick testing.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/ef4444/ffffff?text=For+Bigger+Blazes",
    duration: 15, // 15 seconds
    tags: "test-video,short-format,quality-test",
  },
  {
    title: "For Bigger Escapes - Adventure Content",
    description: "An exciting adventure test video showcasing various scenes and landscapes. Perfect for testing video player features and streaming capabilities.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/10b981/ffffff?text=For+Bigger+Escapes",
    duration: 15, // 15 seconds
    tags: "adventure,landscape,test-video",
  },
];

async function main() {
  console.log("🚀 Starting video upload to Vercel database...\n");

  try {
    // Get or create a test user
    const testUser = await prisma.user.findFirst({
      where: { email: "creator@bstream.dev" },
    });

    if (!testUser) {
      console.log("❌ Test user 'creator@bstream.dev' not found.");
      console.log("   Please create a user first or run: npm run db:seed");
      process.exit(1);
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

