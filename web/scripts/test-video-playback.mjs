#!/usr/bin/env node
/**
 * Test script to verify video playback functionality
 * Tests that all videos can be accessed and their URLs are valid
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient();

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url || url.startsWith('blob:') || url.startsWith('/uploads/')) {
      resolve({ valid: true, accessible: 'N/A (local/blob)' });
      return;
    }

    if (url.startsWith('data:')) {
      resolve({ valid: true, accessible: 'N/A (data URI)' });
      return;
    }

    const client = url.startsWith('https:') ? https : http;
    const timeout = 5000; // 5 second timeout

    const req = client.get(url, { timeout }, (res) => {
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 400) {
        resolve({ valid: true, accessible: true, statusCode });
      } else {
        resolve({ valid: true, accessible: false, statusCode });
      }
      res.destroy();
    });

    req.on('error', (error) => {
      resolve({ valid: false, accessible: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: true, accessible: false, error: 'Timeout' });
    });

    req.setTimeout(timeout);
  });
}

async function testVideoPlayback() {
  console.log('🧪 Testing video playback functionality...\n');

  try {
    const videos = await prisma.video.findMany({
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

    console.log(`📊 Testing ${videos.length} videos...\n`);

    let allValid = true;
    const results = [];

    for (const video of videos) {
      console.log(`📹 Testing: ${video.title}`);
      
      // Test video URL
      console.log(`   Checking videoUrl...`);
      const videoUrlCheck = await checkUrl(video.videoUrl);
      if (!videoUrlCheck.valid || videoUrlCheck.accessible === false) {
        console.log(`   ❌ Video URL issue: ${videoUrlCheck.error || 'Not accessible'}`);
        allValid = false;
      } else {
        console.log(`   ✅ Video URL: ${videoUrlCheck.accessible === true ? 'Accessible' : videoUrlCheck.accessible}`);
      }

      // Test thumbnail URL
      console.log(`   Checking thumbnailUrl...`);
      const thumbnailUrlCheck = await checkUrl(video.thumbnailUrl);
      if (!thumbnailUrlCheck.valid || (thumbnailUrlCheck.accessible === false && !video.thumbnailUrl.startsWith('/uploads/'))) {
        console.log(`   ⚠️  Thumbnail URL: ${thumbnailUrlCheck.error || 'Not accessible'}`);
      } else {
        console.log(`   ✅ Thumbnail URL: ${thumbnailUrlCheck.accessible === true ? 'Accessible' : thumbnailUrlCheck.accessible}`);
      }

      // Test video qualities
      if (video.qualities.length > 0) {
        console.log(`   Checking ${video.qualities.length} quality versions...`);
        for (const quality of video.qualities) {
          if (quality.status === 'ready') {
            const qualityCheck = await checkUrl(quality.videoUrl);
            if (qualityCheck.valid && qualityCheck.accessible !== false) {
              console.log(`   ✅ Quality ${quality.quality}: OK`);
            } else {
              console.log(`   ⚠️  Quality ${quality.quality}: ${qualityCheck.error || 'Not accessible'}`);
            }
          }
        }
      }

      results.push({
        id: video.id,
        title: video.title,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        videoUrlValid: videoUrlCheck.valid && videoUrlCheck.accessible !== false,
        thumbnailUrlValid: thumbnailUrlCheck.valid && (thumbnailUrlCheck.accessible !== false || video.thumbnailUrl.startsWith('/uploads/')),
        qualities: video.qualities.length,
      });

      console.log('');
    }

    console.log('='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    
    const validVideos = results.filter(r => r.videoUrlValid && r.thumbnailUrlValid).length;
    const invalidVideos = results.length - validVideos;

    console.log(`Total videos tested: ${results.length}`);
    console.log(`✅ Videos ready to play: ${validVideos}`);
    console.log(`❌ Videos with issues: ${invalidVideos}`);
    console.log('='.repeat(60));

    if (invalidVideos > 0) {
      console.log('\n⚠️  Videos with issues:');
      results
        .filter(r => !r.videoUrlValid || !r.thumbnailUrlValid)
        .forEach(r => {
          console.log(`   - ${r.title}`);
          if (!r.videoUrlValid) console.log(`     Video URL: ${r.videoUrl.substring(0, 60)}...`);
          if (!r.thumbnailUrlValid) console.log(`     Thumbnail URL: ${r.thumbnailUrl.substring(0, 60)}...`);
        });
    }

    if (allValid && invalidVideos === 0) {
      console.log('\n✅ All videos are ready to play!');
      console.log('\n🌐 Test URLs:');
      results.slice(0, 3).forEach(r => {
        console.log(`   http://localhost:3000/video/${r.id}`);
      });
      process.exit(0);
    } else {
      console.log('\n⚠️  Some videos have issues. Please review the output above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testVideoPlayback();

