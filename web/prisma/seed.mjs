import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("watchmore", 10);

  const user = await prisma.user.upsert({
    where: { email: "creator@bstream.dev" },
    update: {},
    create: {
      email: "creator@bstream.dev",
      name: "Bstream Creator",
      passwordHash,
      bio: "Sharing cinematic tech explainers and live event coverage.",
      image: "https://api.dicebear.com/9.x/initials/svg?seed=Bstream",
    },
  });

  const channel = await prisma.channel.upsert({
    where: { handle: "bstream-studio" },
    update: {},
    create: {
      name: "Bstream Studio",
      handle: "bstream-studio",
      description:
        "Weekly deep-dives into creator tooling, streaming infrastructure, and behind-the-scenes vlogs.",
      avatarUrl:
        "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=400&q=80",
      bannerUrl:
        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=80",
      ownerId: user.id,
    },
  });

const sampleVideos = [
    {
      title: "How Live Streaming Works in 2025",
      description:
        "From ingest to CDN to adaptive playback in under 15 minutes. A crash course for aspiring video engineers.",
      videoUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      duration: 914,
      tags: ["streaming", "cdn", "infra"],
    },
    {
      title: "Creator Gear Setup Tour",
      description:
        "Let’s unbox the gear powering our daily uploads: cameras, lights, mics, switchers, and automation.",
      videoUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80",
      duration: 732,
      tags: ["gear", "studio", "vlog"],
    },
    {
      title: "Short Film: Signal Lost",
      description:
        "An indie sci-fi short created with our community over livestream. Shot on mini budgets but big ambition.",
      videoUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80",
      duration: 786,
      tags: ["short-film", "sci-fi", "community"],
    },
  ];

  for (const [index, video] of sampleVideos.entries()) {
    await prisma.video.upsert({
      where: { videoUrl: video.videoUrl },
      update: {},
        create: {
          ...video,
          tags: video.tags.join(","),
        status: "READY",
        publishedAt: new Date(Date.now() - index * 1000 * 60 * 60 * 24),
        channelId: channel.id,
        comments: {
          create: [
            {
              content: "Loved the pacing and insights here!",
              authorId: user.id,
            },
          ],
        },
      },
    });
  }

  await prisma.playlist.upsert({
    where: { title: "Creator Essentials" },
    update: {},
    create: {
      title: "Creator Essentials",
      description: "Start here to learn about building video-first products.",
      ownerId: user.id,
      videos: {
        create: sampleVideos.map((video, order) => ({
          order,
          video: {
            connect: { videoUrl: video.videoUrl },
          },
        })),
      },
    },
  });

  console.log("Database seeded. Login with creator@bstream.dev / watchmore");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

