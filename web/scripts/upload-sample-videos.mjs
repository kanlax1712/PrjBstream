#!/usr/bin/env node
/**
 * Script to upload sample videos to Vercel deployment
 * Uses free sample videos from public sources
 */

const VERCEL_URL = process.env.VERCEL_URL || "https://bstreamtest.vercel.app";
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "creator@bstream.dev";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "watchmore";

// Free sample videos from public sources (these are test videos)
const SAMPLE_VIDEOS = [
  {
    title: "Sample Nature Video - Mountains",
    description: "A beautiful sample video showcasing mountain landscapes. This is a free sample video for testing purposes.",
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/06b6d4/ffffff?text=Nature+Video",
    duration: 60,
    tags: "nature, mountains, landscape, sample",
  },
  {
    title: "Sample Tech Demo Video",
    description: "A sample technology demonstration video. Perfect for testing video upload and playback functionality.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/3b82f6/ffffff?text=Tech+Demo",
    duration: 120,
    tags: "technology, demo, sample, test",
  },
  {
    title: "Sample Animation Video",
    description: "A sample animated video for testing video streaming capabilities and player functionality.",
    videoUrl: "https://sample-videos.com/video123/mp4/480/big_buck_bunny_480p_1mb.mp4",
    thumbnailUrl: "https://via.placeholder.com/800x450/8b5cf6/ffffff?text=Animation",
    duration: 90,
    tags: "animation, sample, test, video",
  },
];

async function login() {
  console.log("🔐 Logging in...");
  
  const response = await fetch(`${VERCEL_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      redirect: "false",
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  // Get cookies from response
  const cookies = response.headers.get("set-cookie");
  if (!cookies) {
    throw new Error("No session cookie received");
  }

  console.log("✅ Logged in successfully");
  return cookies;
}

async function downloadVideo(url) {
  console.log(`📥 Downloading video from: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error(`❌ Error downloading video: ${error.message}`);
    return null;
  }
}

async function uploadVideo(videoData, cookies) {
  console.log(`📤 Uploading: ${videoData.title}`);
  
  // Download the video first
  const videoBlob = await downloadVideo(videoData.videoUrl);
  if (!videoBlob) {
    console.log(`⏭️  Skipping ${videoData.title} - download failed`);
    return;
  }

  // Create FormData
  const formData = new FormData();
  formData.append("title", videoData.title);
  formData.append("description", videoData.description);
  formData.append("duration", videoData.duration.toString());
  formData.append("tags", videoData.tags);
  formData.append("hasAds", "false");
  
  // Convert blob to File
  const videoFile = new File([videoBlob], `sample-${Date.now()}.mp4`, {
    type: "video/mp4",
  });
  formData.append("videoFile", videoFile);

  try {
    const response = await fetch(`${VERCEL_URL}/api/upload-video`, {
      method: "POST",
      headers: {
        Cookie: cookies,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Uploaded: ${videoData.title}`);
      console.log(`   Video ID: ${result.videoId}`);
    } else {
      console.error(`❌ Failed: ${videoData.title}`);
      console.error(`   Error: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error uploading ${videoData.title}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Starting sample video upload...");
  console.log(`📍 Target: ${VERCEL_URL}\n`);

  try {
    // Login first
    const cookies = await login();
    
    // Upload each sample video
    console.log(`\n📹 Uploading ${SAMPLE_VIDEOS.length} sample videos...\n`);
    
    for (let i = 0; i < SAMPLE_VIDEOS.length; i++) {
      const video = SAMPLE_VIDEOS[i];
      console.log(`[${i + 1}/${SAMPLE_VIDEOS.length}] ${video.title}`);
      await uploadVideo(video, cookies);
      
      // Wait a bit between uploads
      if (i < SAMPLE_VIDEOS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.log();
    }

    console.log("✅ All sample videos uploaded!");
    console.log(`🌐 View them at: ${VERCEL_URL}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();

