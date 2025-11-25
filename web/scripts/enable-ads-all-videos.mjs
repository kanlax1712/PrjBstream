import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Enabling ads for all existing videos...");

  const result = await prisma.video.updateMany({
    where: {
      hasAds: false, // Only update videos that don't have ads enabled
    },
    data: {
      hasAds: true,
    },
  });

  console.log(`✅ Updated ${result.count} videos to enable ads`);
  console.log("📺 All videos will now show 5-second ads at the start");
}

main()
  .catch((error) => {
    console.error("❌ Error enabling ads:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

