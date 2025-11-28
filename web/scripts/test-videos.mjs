#!/usr/bin/env node
/**
 * Test script to verify all videos are loading correctly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVideos() {
  console.log('🧪 Testing video data...\n');

  try {
    // Get all videos
    const allVideos = await prisma.video.findMany({
      where: {
        visibility: 'PUBLIC',
        status: 'READY',
      },
      include: {
        channel: {
          select: { id: true, name: true, handle: true },
        },
        qualities: {
          select: { quality: true, videoUrl: true, status: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    console.log(`📊 Total videos found: ${allVideos.length}\n`);

    if (allVideos.length === 0) {
      console.log('⚠️  No videos found in database!');
      await prisma.$disconnect();
      process.exit(1);
    }

    let validCount = 0;
    let invalidCount = 0;
    const issues = [];

    for (const video of allVideos) {
      const problems = [];

      // Check videoUrl
      if (!video.videoUrl || video.videoUrl.trim() === '') {
        problems.push('Missing videoUrl');
      } else if (!video.videoUrl.startsWith('http') && !video.videoUrl.startsWith('/uploads/') && !video.videoUrl.startsWith('blob:')) {
        problems.push(`Invalid videoUrl format: ${video.videoUrl.substring(0, 50)}`);
      }

      // Check thumbnailUrl
      if (!video.thumbnailUrl || video.thumbnailUrl.trim() === '') {
        problems.push('Missing thumbnailUrl');
      } else if (video.thumbnailUrl.startsWith('data:image/')) {
        problems.push('Using data URI thumbnail (should be converted to URL)');
      }

      // Check channel
      if (!video.channel) {
        problems.push('Missing channel');
      }

      // Check qualities
      if (video.qualities.length === 0) {
        problems.push('No VideoQuality records found');
      }

      if (problems.length > 0) {
        invalidCount++;
        issues.push({
          id: video.id,
          title: video.title,
          problems,
        });
        console.log(`❌ ${video.title}`);
        problems.forEach(p => console.log(`   - ${p}`));
      } else {
        validCount++;
        console.log(`✅ ${video.title}`);
        console.log(`   VideoUrl: ${video.videoUrl.substring(0, 60)}...`);
        console.log(`   ThumbnailUrl: ${video.thumbnailUrl.substring(0, 60)}...`);
        console.log(`   Channel: ${video.channel?.name || 'N/A'}`);
        console.log(`   Qualities: ${video.qualities.length}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total videos: ${allVideos.length}`);
    console.log(`✅ Valid videos: ${validCount}`);
    console.log(`❌ Videos with issues: ${invalidCount}`);
    console.log('='.repeat(60));

    if (invalidCount > 0) {
      console.log('\n⚠️  Some videos have issues. Run `npm run db:sync-videos` to fix them.');
      process.exit(1);
    } else {
      console.log('\n✅ All videos are valid and ready to play!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testVideos();

