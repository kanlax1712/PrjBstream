#!/usr/bin/env node
/**
 * Update thumbnails for existing sample videos
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VIDEO_THUMBNAILS = {
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2306b6d4'/%3E%3Cstop offset='100%25' style='stop-color:%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EBig Buck Bunny%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E10 min • Animation%3C/text%3E%3C/svg%3E",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%233b82f6'/%3E%3Cstop offset='100%25' style='stop-color:%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EElephants Dream%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E11 min • Sci-Fi%3C/text%3E%3C/svg%3E",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238b5cf6'/%3E%3Cstop offset='100%25' style='stop-color:%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3ESintel%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E15 min • Fantasy%3C/text%3E%3C/svg%3E",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f59e0b'/%3E%3Cstop offset='100%25' style='stop-color:%23ef4444'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3ETears of Steel%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E12 min • Action%3C/text%3E%3C/svg%3E",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ef4444'/%3E%3Cstop offset='100%25' style='stop-color:%23dc2626'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EFor Bigger Blazes%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E15 sec • Test Video%3C/text%3E%3C/svg%3E",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2310b981'/%3E%3Cstop offset='100%25' style='stop-color:%23059669'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EFor Bigger Escapes%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E15 sec • Adventure%3C/text%3E%3C/svg%3E",
};

async function main() {
  console.log("🖼️  Updating video thumbnails...\n");

  let updated = 0;
  for (const [videoUrl, thumbnailUrl] of Object.entries(VIDEO_THUMBNAILS)) {
    try {
      const result = await prisma.video.updateMany({
        where: { videoUrl },
        data: { thumbnailUrl },
      });
      if (result.count > 0) {
        console.log(`✅ Updated thumbnail for: ${videoUrl.substring(0, 60)}...`);
        updated += result.count;
      }
    } catch (error) {
      console.error(`❌ Error updating ${videoUrl}:`, error.message);
    }
  }

  console.log(`\n✅ Updated ${updated} video thumbnails!`);
  await prisma.$disconnect();
}

main();

