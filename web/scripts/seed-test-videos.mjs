import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Placeholder image data URI (free, no external dependencies)
const PLACEHOLDER_THUMBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2306b6d4;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%233b82f6;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3EVideo Thumbnail%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2306b6d4;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%233b82f6;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'%3EBS%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_BANNER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2306b6d4;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%233b82f6;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='400' fill='url(%23grad)'/%3E%3C/svg%3E";

// Free test videos from various sources (YouTube-like, Dailymotion-like formats)
const testVideos = [
  {
    title: "Big Buck Bunny - Open Source Movie",
    description: "A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness. This is a free, open-source animated short film.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 596, // ~10 minutes
    tags: "animation,open-source,free,creative-commons",
    source: "Google Cloud Storage",
  },
  {
    title: "Elephants Dream - Blender Foundation",
    description: "The first open movie project made with free software tools. A story about two strange characters exploring a surreal, futuristic world.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 653, // ~11 minutes
    tags: "blender,3d-animation,open-source,sci-fi",
    source: "Google Cloud Storage",
  },
  {
    title: "Sintel - Blender Open Movie",
    description: "A fantasy action adventure about a young woman searching for her lost dragon companion. Created entirely with open-source software.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 888, // ~15 minutes
    tags: "fantasy,adventure,blender,open-source",
    source: "Google Cloud Storage",
  },
  {
    title: "Tears of Steel - Blender Foundation",
    description: "A science fiction short film about a group of warriors and scientists who gather at the Oude Kerk in a future Amsterdam to stage a crucial event.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 734, // ~12 minutes
    tags: "sci-fi,action,blender,amsterdam",
    source: "Google Cloud Storage",
  },
  {
    title: "For Bigger Blazes - Test Video",
    description: "A high-quality test video featuring dynamic scenes perfect for testing video playback, streaming, and quality settings.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 15, // 15 seconds
    tags: "test-video,short-format,quality-test",
    source: "Google Cloud Storage",
  },
  {
    title: "For Bigger Escapes - Adventure Content",
    description: "An exciting adventure test video showcasing various scenes and landscapes. Perfect for testing video player features and streaming capabilities.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 15, // 15 seconds
    tags: "adventure,landscape,test-video",
    source: "Google Cloud Storage",
  },
  {
    title: "For Bigger Fun - Entertainment Video",
    description: "A fun and engaging test video designed for entertainment and testing purposes. Features vibrant colors and dynamic motion.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 60, // 1 minute
    tags: "entertainment,fun,test-video",
    source: "Google Cloud Storage",
  },
  {
    title: "For Bigger Joyrides - Action Content",
    description: "Fast-paced action test video featuring exciting scenes. Ideal for testing video quality, playback speed, and streaming performance.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 15, // 15 seconds
    tags: "action,fast-paced,test-video",
    source: "Google Cloud Storage",
  },
  {
    title: "For Bigger Meltdowns - Drama Test",
    description: "A dramatic test video with intense scenes. Perfect for testing video player controls, quality switching, and subtitle support.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 10, // 10 seconds
    tags: "drama,intense,test-video",
    source: "Google Cloud Storage",
  },
  {
    title: "Sintel Trailer - Preview",
    description: "A preview trailer of the full Sintel movie. Showcasing the stunning visuals and storytelling of this open-source animated film.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    thumbnailUrl: PLACEHOLDER_THUMBNAIL,
    duration: 15, // 15 seconds
    tags: "trailer,preview,animation",
    source: "Google Cloud Storage",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("test123", 10); // Changed password for test user

  const user = await prisma.user.upsert({
    where: { email: "test@bstream.dev" },
    update: {},
    create: {
      email: "test@bstream.dev",
      name: "Test User",
      passwordHash,
      bio: "This is a test user account for Bstream.",
      image: "https://api.dicebear.com/9.x/initials/svg?seed=Test",
    },
  });

  const channel = await prisma.channel.upsert({
    where: { handle: "test-channel" },
    update: {},
    create: {
      name: "Test Channel",
      handle: "test-channel",
      description: "Channel for testing purposes with sample videos.",
      avatarUrl: PLACEHOLDER_AVATAR,
      bannerUrl: PLACEHOLDER_BANNER,
      ownerId: user.id,
    },
  });

  for (const [index, video] of testVideos.entries()) {
    await prisma.video.upsert({
      where: { videoUrl: video.videoUrl },
      update: {},
      create: {
        ...video,
        tags: video.tags,
        status: "READY",
        visibility: "PUBLIC", // Ensure videos are public
        publishedAt: new Date(Date.now() - index * 1000 * 60 * 60 * 24),
        channelId: channel.id,
        comments: {
          create: [
            {
              content: `Great video! This is a test comment for "${video.title}".`,
              authorId: user.id,
            },
          ],
        },
      },
    });
  }

  await prisma.playlist.upsert({
    where: { title: "Test Playlist" },
    update: {},
    create: {
      title: "Test Playlist",
      description: "A playlist containing sample videos for testing.",
      ownerId: user.id,
      videos: {
        create: testVideos.map((video, order) => ({
          order,
          video: {
            connect: { videoUrl: video.videoUrl },
          },
        })),
      },
    },
  });

  console.log("Database seeded with test videos. Login with test@bstream.dev / test123");
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
