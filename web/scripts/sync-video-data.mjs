#!/usr/bin/env node
/**
 * Video Data Synchronization Script
 * 
 * This script validates and synchronizes video files, thumbnails, and related data
 * in the database. It ensures:
 * - All videos have valid videoUrl and thumbnailUrl
 * - VideoQuality records are properly linked
 * - Orphaned records are cleaned up
 * - All relationships are correct
 * 
 * Works for both localhost and Vercel deployment (uses same database)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default placeholder thumbnail URL
const DEFAULT_THUMBNAIL = 'https://via.placeholder.com/800x450/06b6d4/ffffff?text=No+Thumbnail';

/**
 * Generate a placeholder thumbnail URL for a video
 */
function generatePlaceholderThumbnail(title) {
  const encodedTitle = encodeURIComponent(title.substring(0, 30));
  return `https://via.placeholder.com/800x450/06b6d4/ffffff?text=${encodedTitle}`;
}

/**
 * Convert data URI thumbnail to placeholder URL
 */
function convertDataUriToPlaceholder(dataUri, title) {
  if (dataUri && dataUri.startsWith('data:image/')) {
    return generatePlaceholderThumbnail(title);
  }
  return dataUri;
}

/**
 * Validate video URL format
 */
function isValidVideoUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  // Check if it's a valid URL (http/https) or a valid path (/uploads/...)
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('/uploads/') ||
         url.startsWith('blob:');
}

/**
 * Validate thumbnail URL format
 */
function isValidThumbnailUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  // Check if it's a valid URL (http/https), path (/uploads/...), or data URI
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('/uploads/') ||
         url.startsWith('data:image/') ||
         url.startsWith('blob:');
}

/**
 * Fix video record
 */
async function fixVideo(video) {
  const updates = {};
  let needsUpdate = false;

  // Fix videoUrl if invalid
  if (!isValidVideoUrl(video.videoUrl)) {
    console.warn(`⚠️  Video ${video.id} has invalid videoUrl: ${video.videoUrl}`);
    // Can't auto-fix missing videoUrl, but we can mark it
    needsUpdate = true;
  }

  // Fix thumbnailUrl if invalid or missing
  if (!isValidThumbnailUrl(video.thumbnailUrl)) {
    console.warn(`⚠️  Video ${video.id} has invalid thumbnailUrl: ${video.thumbnailUrl}`);
    updates.thumbnailUrl = generatePlaceholderThumbnail(video.title);
    needsUpdate = true;
  }

  // Convert data URI thumbnails to placeholder URLs (better for performance and compatibility)
  if (video.thumbnailUrl && video.thumbnailUrl.startsWith('data:image/')) {
    console.log(`🔄 Converting data URI thumbnail to placeholder URL for video ${video.id}`);
    updates.thumbnailUrl = generatePlaceholderThumbnail(video.title);
    needsUpdate = true;
  }

  // Ensure videoUrl is unique (handle duplicates)
  // Note: Prisma schema has @unique on videoUrl, so duplicates shouldn't exist
  // But we check anyway to be safe
  if (video.videoUrl) {
    try {
      const duplicates = await prisma.video.findMany({
        where: {
          videoUrl: video.videoUrl,
          id: { not: video.id },
        },
      });

      if (duplicates.length > 0) {
        console.warn(`⚠️  Video ${video.id} has duplicate videoUrl: ${video.videoUrl}`);
        // Generate a unique videoUrl by appending the video ID
        const urlParts = video.videoUrl.split('.');
        const ext = urlParts.length > 1 ? urlParts.pop() : 'mp4';
        const baseUrl = urlParts.join('.');
        updates.videoUrl = `${baseUrl}-${video.id}.${ext}`;
        needsUpdate = true;
      }
    } catch (error) {
      // Ignore unique constraint errors - they're expected
      if (!error.message.includes('Unique constraint')) {
        console.error(`Error checking duplicates for video ${video.id}:`, error.message);
      }
    }
  }

  // Ensure channelId is valid
  if (video.channelId) {
    const channel = await prisma.channel.findUnique({
      where: { id: video.channelId },
    });

    if (!channel) {
      console.error(`❌ Video ${video.id} has invalid channelId: ${video.channelId}`);
      // Try to find a default channel or create one
      const defaultChannel = await prisma.channel.findFirst();
      if (defaultChannel) {
        updates.channelId = defaultChannel.id;
        needsUpdate = true;
      } else {
        console.error(`❌ No default channel found for video ${video.id}`);
      }
    }
  }

  if (needsUpdate) {
    try {
      await prisma.video.update({
        where: { id: video.id },
        data: updates,
      });
      console.log(`✅ Fixed video ${video.id}: ${video.title}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to fix video ${video.id}:`, error.message);
      return false;
    }
  }

  return false;
}

/**
 * Sync VideoQuality records
 */
async function syncVideoQualities(video) {
  const qualities = await prisma.videoQuality.findMany({
    where: { videoId: video.id },
  });

  // Check for orphaned qualities (videoId doesn't match)
  for (const quality of qualities) {
    if (quality.videoId !== video.id) {
      console.warn(`⚠️  Orphaned VideoQuality ${quality.id} found`);
      // Delete orphaned quality
      try {
        await prisma.videoQuality.delete({
          where: { id: quality.id },
        });
        console.log(`✅ Deleted orphaned VideoQuality ${quality.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete orphaned VideoQuality ${quality.id}:`, error.message);
      }
    }
  }

  // Ensure at least one quality record exists (original)
  const originalQuality = qualities.find(q => q.quality === 'original' || q.quality === 'Original');
  if (!originalQuality && video.videoUrl) {
    try {
      await prisma.videoQuality.create({
        data: {
          videoId: video.id,
          quality: 'original',
          videoUrl: video.videoUrl,
          status: 'ready',
        },
      });
      console.log(`✅ Created original VideoQuality for video ${video.id}`);
    } catch (error) {
      console.error(`❌ Failed to create original VideoQuality for video ${video.id}:`, error.message);
    }
  }
}

/**
 * Clean up orphaned records
 */
async function cleanupOrphanedRecords() {
  console.log('\n🧹 Cleaning up orphaned records...');

  // Get all video IDs
  const allVideoIds = new Set(
    (await prisma.video.findMany({ select: { id: true } })).map(v => v.id)
  );

  // Clean up orphaned comments
  const allComments = await prisma.comment.findMany({
    select: { id: true, videoId: true },
  });

  const orphanedComments = allComments.filter(c => !allVideoIds.has(c.videoId));

  if (orphanedComments.length > 0) {
    console.log(`Found ${orphanedComments.length} orphaned comments`);
    for (const comment of orphanedComments) {
      try {
        await prisma.comment.delete({
          where: { id: comment.id },
        });
        console.log(`✅ Deleted orphaned comment ${comment.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete orphaned comment ${comment.id}:`, error.message);
      }
    }
  }

  // Clean up orphaned view events
  const allViews = await prisma.viewEvent.findMany({
    select: { id: true, videoId: true },
  });

  const orphanedViews = allViews.filter(v => !allVideoIds.has(v.videoId));

  if (orphanedViews.length > 0) {
    console.log(`Found ${orphanedViews.length} orphaned view events`);
    for (const view of orphanedViews) {
      try {
        await prisma.viewEvent.delete({
          where: { id: view.id },
        });
        console.log(`✅ Deleted orphaned view event ${view.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete orphaned view event ${view.id}:`, error.message);
      }
    }
  }

  // Clean up orphaned playlist videos
  const allPlaylistVideos = await prisma.playlistVideo.findMany({
    select: { id: true, videoId: true },
  });

  const orphanedPlaylistVideos = allPlaylistVideos.filter(pv => !allVideoIds.has(pv.videoId));

  if (orphanedPlaylistVideos.length > 0) {
    console.log(`Found ${orphanedPlaylistVideos.length} orphaned playlist videos`);
    for (const pv of orphanedPlaylistVideos) {
      try {
        await prisma.playlistVideo.delete({
          where: { id: pv.id },
        });
        console.log(`✅ Deleted orphaned playlist video ${pv.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete orphaned playlist video ${pv.id}:`, error.message);
      }
    }
  }

  // Clean up orphaned video qualities
  const allQualities = await prisma.videoQuality.findMany({
    select: { id: true, videoId: true },
  });

  const orphanedQualities = allQualities.filter(q => !allVideoIds.has(q.videoId));

  if (orphanedQualities.length > 0) {
    console.log(`Found ${orphanedQualities.length} orphaned video qualities`);
    for (const quality of orphanedQualities) {
      try {
        await prisma.videoQuality.delete({
          where: { id: quality.id },
        });
        console.log(`✅ Deleted orphaned video quality ${quality.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete orphaned video quality ${quality.id}:`, error.message);
      }
    }
  }
}

/**
 * Main synchronization function
 */
async function syncVideoData() {
  console.log('🚀 Starting video data synchronization...\n');

  try {
    // Get all videos
    const videos = await prisma.video.findMany({
      include: {
        channel: true,
        qualities: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    console.log(`📊 Found ${videos.length} videos to process\n`);

    let fixedCount = 0;
    let errorCount = 0;

    // Process each video
    for (const video of videos) {
      console.log(`\n📹 Processing: ${video.title} (${video.id})`);
      console.log(`   VideoUrl: ${video.videoUrl || 'MISSING'}`);
      console.log(`   ThumbnailUrl: ${video.thumbnailUrl || 'MISSING'}`);
      console.log(`   Channel: ${video.channel?.name || 'MISSING'}`);
      console.log(`   Qualities: ${video.qualities.length}`);

      const wasFixed = await fixVideo(video);
      if (wasFixed) {
        fixedCount++;
      }

      // Sync video qualities
      await syncVideoQualities(video);

      // Check for errors
      if (!video.videoUrl || !isValidVideoUrl(video.videoUrl)) {
        errorCount++;
        console.error(`   ❌ Video ${video.id} has invalid videoUrl`);
      }
      if (!video.thumbnailUrl || !isValidThumbnailUrl(video.thumbnailUrl)) {
        errorCount++;
        console.error(`   ❌ Video ${video.id} has invalid thumbnailUrl`);
      }
    }

    // Clean up orphaned records
    await cleanupOrphanedRecords();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Synchronization Summary');
    console.log('='.repeat(60));
    console.log(`Total videos processed: ${videos.length}`);
    console.log(`Videos fixed: ${fixedCount}`);
    console.log(`Videos with errors: ${errorCount}`);
    console.log(`Videos OK: ${videos.length - errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Some videos still have issues. Please review the logs above.');
      process.exit(1);
    } else {
      console.log('\n✅ All videos are synchronized and valid!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Synchronization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the synchronization
syncVideoData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

