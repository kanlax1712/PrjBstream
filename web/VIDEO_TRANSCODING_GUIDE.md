# Video Transcoding Guide

This application supports video transcoding to multiple quality levels (480p, 720p, 1080p, 1440p, 2160p) using FFmpeg for video compression and bitrate adjustment.

## How It Works

### 1. **Transcoding Process**
When a video is uploaded, the system automatically triggers transcoding to create multiple quality versions:

- **480p (SD)**: 1000k bitrate, suitable for slower connections
- **720p (HD)**: 2500k bitrate, standard HD quality
- **1080p (Full HD)**: 5000k bitrate, high quality
- **1440p (2K)**: 10000k bitrate, ultra-high quality
- **2160p (4K)**: 20000k bitrate, maximum quality

### 2. **Video Compression**
The transcoding process uses:
- **Codec**: H.264 (libx264) for maximum compatibility
- **Compression**: CRF (Constant Rate Factor) of 23 for optimal quality/size balance
- **Variable Bitrate (VBR)**: Uses target bitrate with max bitrate for better quality control
- **Audio**: AAC codec at 128k bitrate

### 3. **Bitrate Adjustment**
Each quality level has specific bitrate settings:
- Target bitrate: Base bitrate for the quality level
- Max bitrate: Maximum bitrate for VBR encoding
- Buffer size: Controls rate control buffer

## Installation

### Prerequisites

**FFmpeg must be installed on your server** for transcoding to work.

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

#### Linux (CentOS/RHEL)
```bash
sudo yum install ffmpeg
```

#### Windows
Download from [FFmpeg official website](https://ffmpeg.org/download.html) and add to PATH.

### Verify Installation
```bash
ffmpeg -version
```

## Database Migration

After updating the schema, run:

```bash
cd web
npx prisma migrate dev
```

This creates the `VideoQuality` table to store multiple quality versions.

## Usage

### Automatic Transcoding

When a video is uploaded:
1. Original video is saved
2. Transcoding job is automatically triggered
3. Multiple quality versions are created in the background
4. Quality records are stored in the database

### Manual Transcoding

To manually trigger transcoding for an existing video:

```bash
POST /api/video/[videoId]/transcode
```

Requires authentication and video ownership.

### Video Quality Selection

Users can select video quality from the player settings:
- **Auto**: Automatically selects best quality based on connection
- **480p**: Standard definition
- **720p**: High definition
- **1080p**: Full HD
- **1440p**: 2K
- **2160p**: 4K

### API Endpoints

#### Get Video by Quality
```
GET /api/video/[videoId]/quality/[quality]
```

Supports:
- `480p`, `720p`, `1080p`, `1440p`, `2160p`, `original`

Returns the video file with appropriate headers for streaming.

#### Trigger Transcoding
```
POST /api/video/[videoId]/transcode
```

Requires:
- Authentication
- Video ownership

## Technical Details

### Transcoding Parameters

The transcoding uses these FFmpeg parameters:

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \           # H.264 video codec
  -preset medium \          # Encoding speed
  -crf 23 \                 # Quality factor
  -vf scale=WIDTH:HEIGHT \  # Resolution scaling
  -b:v BITRATE \            # Target bitrate
  -maxrate MAX_BITRATE \    # Max bitrate (VBR)
  -bufsize BUFFER_SIZE \    # Rate control buffer
  -c:a aac \                # AAC audio codec
  -b:a 128k \               # Audio bitrate
  -movflags +faststart \    # Web optimization
  output.mp4
```

### File Storage

Transcoded videos are stored in:
```
public/uploads/qualities/[videoId]/
  ├── 480p.mp4
  ├── 720p.mp4
  ├── 1080p.mp4
  ├── 1440p.mp4
  └── 2160p.mp4
```

### Database Schema

The `VideoQuality` model stores:
- `quality`: Quality level (480p, 720p, etc.)
- `videoUrl`: Path to transcoded file
- `bitrate`: Bitrate in kbps
- `width`/`height`: Video dimensions
- `fileSize`: File size in bytes
- `status`: processing, ready, or failed

## Performance Considerations

1. **Transcoding Time**: Depends on video length and server CPU
   - 1 minute video: ~2-5 minutes
   - 10 minute video: ~20-50 minutes

2. **Storage**: Each quality version takes additional storage
   - Original: 100%
   - 480p: ~20-30% of original
   - 720p: ~40-50% of original
   - 1080p: ~60-70% of original
   - 1440p: ~80-90% of original
   - 2160p: ~100-120% of original

3. **Background Processing**: Transcoding runs asynchronously to avoid blocking uploads

## Troubleshooting

### FFmpeg Not Found
Error: "FFmpeg is not installed"
Solution: Install FFmpeg (see Installation section)

### Transcoding Fails
Check:
1. FFmpeg is installed and accessible
2. Sufficient disk space
3. Server has enough CPU/memory
4. Video file is valid

### Quality Not Available
- Check if transcoding completed successfully
- Verify quality file exists in storage
- Check database for quality status

## Future Enhancements

- Adaptive streaming (HLS/DASH)
- GPU-accelerated transcoding
- Cloud transcoding services integration
- Automatic quality selection based on bandwidth
- Thumbnail generation from video frames

