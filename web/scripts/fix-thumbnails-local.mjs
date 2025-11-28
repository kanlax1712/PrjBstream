#!/usr/bin/env node
/**
 * Fix thumbnails by replacing placeholder.com URLs with local SVG files
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateLocalThumbnail(title) {
  // Use local default thumbnail for all videos
  return '/uploads/default-thumbnail.svg';
}

async function fixThumbnails() {
  console.log('🔧 Fixing thumbnails...\n');

  try {
    const videos = await prisma.video.findMany({
      select: { id: true, title: true, thumbnailUrl: true },
    });

    console.log(`📊 Found ${videos.length} videos to process\n`);

    let fixedCount = 0;

    for (const video of videos) {
      // Check if thumbnail is a placeholder.com URL or data URI
      if (
        video.thumbnailUrl.includes('placeholder.com') ||
        video.thumbnailUrl.startsWith('data:') ||
        !video.thumbnailUrl.startsWith('/uploads/')
      ) {
        const newThumbnail = generateLocalThumbnail(video.title);
        
        try {
          await prisma.video.update({
            where: { id: video.id },
            data: { thumbnailUrl: newThumbnail },
          });
          console.log(`✅ Fixed: ${video.title}`);
          fixedCount++;
        } catch (error) {
          console.error(`❌ Failed to fix ${video.title}:`, error.message);
        }
      } else {
        console.log(`✓ OK: ${video.title}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`Total videos: ${videos.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Already OK: ${videos.length - fixedCount}`);
    console.log('='.repeat(60));

    if (fixedCount > 0) {
      console.log('\n✅ All thumbnails fixed! Using local SVG files.');
    } else {
      console.log('\n✅ All thumbnails are already using local files.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixThumbnails();

