# Video Quality & Thumbnail Guide

This guide explains the video quality and thumbnail features implemented in Bstream.

## 🎬 Thumbnail Selection

### Features
- **Extract from Video**: Users can select a thumbnail frame directly from their uploaded video
- **Interactive Player**: Video player with play/pause and scrubbing controls
- **Quick Select**: Pre-generated thumbnails at key timestamps (10%, 33%, 50%, 70% of video)
- **Manual Capture**: Users can scrub to any frame and capture it as thumbnail
- **Visual Preview**: Selected thumbnail is displayed before upload

### How It Works
1. User uploads a video file
2. Video preview appears with player controls
3. System generates 4 thumbnail previews at different timestamps
4. User can:
   - Click a quick-select thumbnail
   - Scrub through video and capture a frame
   - Use play/pause to find the perfect frame
5. Selected thumbnail is sent with the video upload

### Technical Implementation
- Uses HTML5 `<video>` element for playback
- Canvas API for frame extraction
- Blob conversion for thumbnail upload
- Client-side processing (no server load)

## 📹 Video Quality Support

### Available Qualities
- **Auto (Original)**: Preserves original video quality
- **480p (SD)**: Standard Definition - 854x480
- **720p (HD)**: High Definition - 1280x720
- **1080p (Full HD)**: Full High Definition - 1920x1080
- **1440p (2K)**: 2K Resolution - 2560x1440
- **2160p (4K UHD)**: Ultra High Definition - 3840x2160

### Current Implementation
- ✅ Quality selection UI in upload form
- ✅ Quality preference stored with upload
- ⚠️ **Transcoding not yet implemented** (requires FFmpeg)

### Production Implementation (TODO)

#### Option 1: Server-Side FFmpeg
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
apt-get install ffmpeg  # Linux

# Transcode example
ffmpeg -i input.mp4 \
  -vf scale=854:480 -c:v libx264 -crf 23 -c:a aac -b:a 128k output_480p.mp4 \
  -vf scale=1280:720 -c:v libx264 -crf 23 -c:a aac -b:a 128k output_720p.mp4 \
  -vf scale=1920:1080 -c:v libx264 -crf 23 -c:a aac -b:a 128k output_1080p.mp4
```

#### Option 2: Cloud Transcoding Service
- **AWS MediaConvert**: Professional video transcoding
- **Cloudinary**: Video transformation API
- **Mux**: Video API with automatic transcoding
- **Zencoder**: Video encoding service

#### Option 3: Background Job Processing
```typescript
// Example with Bull Queue
import Queue from 'bull';
const videoQueue = new Queue('video transcoding');

videoQueue.process(async (job) => {
  const { videoId, quality } = job.data;
  // Transcode video to specified quality
  // Update database with quality URL
});
```

### Recommended Architecture

1. **Upload Flow**:
   ```
   User uploads video → Store original → Queue transcoding job → Return success
   ```

2. **Transcoding Flow**:
   ```
   Background worker → Download original → Transcode to all qualities → 
   Upload to storage → Update database → Notify user
   ```

3. **Storage Structure**:
   ```
   /uploads/videos/
     /{videoId}/
       original.mp4
       480p.mp4
       720p.mp4
       1080p.mp4
       1440p.mp4
       2160p.mp4
   ```

4. **Database Schema** (Future):
   ```prisma
   model VideoQuality {
     id        String  @id @default(cuid())
     videoId   String
     quality   String  // "480p", "720p", etc.
     videoUrl  String
     fileSize  Int
     bitrate   Int
     video     Video   @relation(fields: [videoId], references: [id])
   }
   ```

## 🎯 Adaptive Streaming

### HLS (HTTP Live Streaming)
- Apple's adaptive streaming protocol
- Automatically switches quality based on bandwidth
- Works on all modern browsers and devices

### DASH (Dynamic Adaptive Streaming)
- Open standard for adaptive streaming
- Similar to HLS but more flexible
- Better for cross-platform support

### Implementation Example
```typescript
// Generate HLS manifest
ffmpeg -i input.mp4 \
  -c:v libx264 -c:a aac \
  -hls_time 10 -hls_playlist_type vod \
  -hls_segment_filename "output_%03d.ts" \
  output.m3u8
```

## 📊 Quality Selection Logic

### Automatic Quality Selection
The player should automatically select the best quality based on:
- User's network speed
- Device capabilities
- Screen resolution
- User preference

### Manual Quality Selection
Users can manually select quality in the video player:
- Quality menu (gear icon)
- List of available qualities
- Current quality indicator

## 🔧 Setup Instructions

### For Development (Current)
1. Upload videos with quality preference
2. Original video is stored
3. Quality preference is logged
4. Transcoding can be added later

### For Production (Recommended)
1. **Install FFmpeg**:
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install ffmpeg
   ```

2. **Install Node FFmpeg wrapper**:
   ```bash
   npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
   ```

3. **Set up background job queue**:
   ```bash
   npm install bull redis
   ```

4. **Implement transcoding service**:
   - Create transcoding worker
   - Queue jobs on video upload
   - Process in background
   - Update database when complete

## 📝 API Changes Needed

### Update Upload Endpoint
```typescript
// Store quality preference
const video = await prisma.video.create({
  data: {
    // ... existing fields
    qualityPreference: qualityPreference,
    // Store original URL
    videoUrl: storedVideoUrl,
  },
});

// Queue transcoding job
await videoQueue.add({
  videoId: video.id,
  originalUrl: storedVideoUrl,
  qualities: ['480p', '720p', '1080p', '1440p', '2160p'],
});
```

### Add Quality Endpoints
```typescript
// GET /api/video/[id]/qualities
// Returns available quality URLs

// GET /api/video/[id]/stream
// Returns HLS/DASH manifest
```

## 🎨 UI Components

### Thumbnail Selector
- ✅ Video player with controls
- ✅ Frame extraction
- ✅ Quick-select thumbnails
- ✅ Preview selected thumbnail

### Quality Selector
- ✅ Dropdown in upload form
- ⚠️ Player quality menu (to be implemented)
- ⚠️ Quality indicator (to be implemented)

## 🚀 Performance Considerations

### Storage
- Multiple quality versions = more storage
- Consider cloud storage (S3, Cloudflare R2)
- Implement cleanup for old/unused videos

### Processing
- Transcoding is CPU-intensive
- Use background jobs
- Consider cloud transcoding services
- Implement rate limiting

### Delivery
- Use CDN for video delivery
- Enable HTTP/2 or HTTP/3
- Implement range requests for seeking
- Cache video segments

## 📚 Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS Specification](https://tools.ietf.org/html/rfc8216)
- [DASH Specification](https://dashif.org/guidelines/)
- [Video Encoding Best Practices](https://www.encoding.com/encoding-guide/)

---

**Current Status**: 
- ✅ Thumbnail selection implemented
- ✅ Quality selection UI implemented
- ⚠️ Video transcoding pending (requires FFmpeg setup)

**Next Steps**:
1. Set up FFmpeg on server
2. Implement transcoding worker
3. Add quality URLs to database
4. Implement adaptive streaming
5. Add quality selector to video player

---

**Last Updated**: November 2024
**Version**: 1.0.0

