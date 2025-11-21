# Bstream - API Reference Documentation

## Document 4: Complete API Reference

### Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User APIs](#user-apis)
3. [Video APIs](#video-apis)
4. [Channel APIs](#channel-apis)
5. [Comment APIs](#comment-apis)
6. [Playlist APIs](#playlist-apis)
7. [Search API](#search-api)
8. [Analytics APIs](#analytics-apis)
9. [Utility APIs](#utility-apis)

---

## Authentication APIs

### POST /api/auth/[...nextauth]

NextAuth.js authentication endpoint. Handles login, logout, and session management.

**Endpoints**:
- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/signin` - Sign in request
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token

**Request (Sign In)**:
```http
POST /api/auth/signin/credentials
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=password123
```

**Response**:
```json
{
  "url": "/",
  "ok": true,
  "status": 200,
  "error": null
}
```

**Error Response**:
```json
{
  "error": "Invalid credentials",
  "status": 401,
  "ok": false
}
```

---

## User APIs

### POST /api/register

Register a new user account.

**Endpoint**: `/api/register`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Authentication**: Not required

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | User's full name (2-100 chars) |
| `email` | string | Yes | Email address (unique) |
| `password` | string | Yes | Password (min 6 chars) |
| `age` | number | No | User age (13-120) |
| `gender` | string | No | Gender (male/female/other/prefer-not-to-say) |
| `profilePhoto` | File | No | Profile photo image file |
| `location` | string | No | Full location string |
| `country` | string | No | Country name |
| `city` | string | No | City name |

**Example Request**:
```javascript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('password', 'password123');
formData.append('age', '25');
formData.append('gender', 'male');
formData.append('profilePhoto', fileInput.files[0]);

fetch('/api/register', {
  method: 'POST',
  body: formData
});
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Account created successfully!",
  "userId": "clx1234567890"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**Error Response** (500):
```json
{
  "success": false,
  "message": "Registration failed: [error details]"
}
```

**Validation Rules**:
- Name: 2-100 characters
- Email: Valid email format, unique in database
- Password: Minimum 6 characters
- Age: 13-120 (if provided)
- Profile Photo: Image file, any size (recommended < 5MB)

---

## Video APIs

### POST /api/upload-video

Upload a video file with metadata.

**Endpoint**: `/api/upload-video`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Authentication**: Required (session)

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Video title (3-120 chars) |
| `description` | string | Yes | Video description (min 10 chars) |
| `videoFile` | File | Yes | Video file (max 2GB) |
| `thumbnailFile` | File | No | Thumbnail image file |
| `thumbnailUrl` | string | No | Thumbnail image URL |
| `duration` | number | Yes | Video duration in seconds (min 5) |
| `tags` | string | No | Comma-separated tags |

**Example Request**:
```javascript
const formData = new FormData();
formData.append('title', 'My Awesome Video');
formData.append('description', 'This is a great video about...');
formData.append('videoFile', videoFile);
formData.append('duration', '120');
formData.append('tags', 'tutorial,tech,programming');

fetch('/api/upload-video', {
  method: 'POST',
  body: formData
});
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Video \"My Awesome Video\" uploaded successfully!",
  "videoId": "clx9876543210"
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Please sign in before uploading."
}
```

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Title, description, and duration are required."
}
```

**400 File Too Large**:
```json
{
  "success": false,
  "message": "Video file size (2500MB) exceeds 2GB limit."
}
```

**500 Server Error**:
```json
{
  "success": false,
  "message": "Upload failed: [error details]"
}
```

**File Storage**:
- Videos saved to: `public/uploads/videos/`
- Filename format: `video-{timestamp}-{sanitized-name}.{ext}`
- URL format: `/uploads/videos/{filename}`

---

### POST /api/track-view

Track a video view event.

**Endpoint**: `/api/track-view`

**Method**: `POST`

**Content-Type**: `application/json`

**Authentication**: Optional (tracks viewer if logged in)

**Request Body**:
```json
{
  "videoId": "clx9876543210"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

**Error Response** (400):
```json
{
  "error": "Video ID required"
}
```

**Error Response** (404):
```json
{
  "error": "Video not found"
}
```

**Usage**:
- Called automatically after 5 seconds of video playback
- Creates ViewEvent record in database
- Used for analytics and view counts

---

## Channel APIs

### Channel operations are handled through server actions, not direct API routes.

**Server Actions**:
- `subscribeToChannel(channelId)` - Subscribe to a channel
- `unsubscribeFromChannel(channelId)` - Unsubscribe from a channel

**Subscribe Action**:
```typescript
// Server Action
export async function subscribeToChannel(channelId: string) {
  // Returns: { success: boolean, message: string }
}
```

**Usage**:
```typescript
import { subscribeToChannel } from '@/app/actions/subscriptions';

const result = await subscribeToChannel('channel_id');
if (result.success) {
  console.log('Subscribed!');
}
```

---

## Comment APIs

### Comment operations are handled through server actions.

**Server Actions**:
- `addComment(formData)` - Add a comment to a video
- `deleteComment(commentId)` - Delete a comment

**Add Comment Action**:
```typescript
// Server Action
export async function addComment(formData: FormData) {
  // FormData contains:
  // - content: string (1-1000 chars)
  // - videoId: string
  // Returns: { success: boolean, message: string }
}
```

**Example Usage**:
```typescript
import { addComment } from '@/app/actions/comments';

const formData = new FormData();
formData.append('content', 'Great video!');
formData.append('videoId', 'video_id');

const result = await addComment(formData);
```

**Validation**:
- Content: 1-1000 characters
- User must be authenticated
- Video must exist

---

## Playlist APIs

### Playlist operations are handled through server actions.

**Server Actions**:
- `createPlaylist(formData)` - Create a new playlist
- `addVideoToPlaylist(playlistId, videoId)` - Add video to playlist
- `removeVideoFromPlaylist(playlistId, videoId)` - Remove video from playlist

**Create Playlist**:
```typescript
// Server Action
export async function createPlaylist(formData: FormData) {
  // FormData contains:
  // - title: string (required, 1-100 chars)
  // - description: string (optional)
  // - isPublic: boolean (default: true)
  // Returns: { success: boolean, message: string, playlistId?: string }
}
```

**Add Video to Playlist**:
```typescript
// Server Action
export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string
) {
  // Returns: { success: boolean, message: string }
}
```

**Example Usage**:
```typescript
import { createPlaylist, addVideoToPlaylist } from '@/app/actions/playlists';

// Create playlist
const formData = new FormData();
formData.append('title', 'My Playlist');
formData.append('description', 'Awesome videos');
formData.append('isPublic', 'true');

const result = await createPlaylist(formData);

// Add video
if (result.success) {
  await addVideoToPlaylist(result.playlistId, 'video_id');
}
```

---

## Search API

### GET /api/search

Search for videos and channels.

**Endpoint**: `/api/search`

**Method**: `GET`

**Authentication**: Not required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `limit` | number | No | Results limit (default: 20) |

**Example Request**:
```http
GET /api/search?q=tutorial&limit=10
```

**Success Response** (200):
```json
{
  "videos": [
    {
      "id": "clx123",
      "title": "React Tutorial",
      "description": "Learn React...",
      "thumbnailUrl": "/uploads/thumbnails/thumb.jpg",
      "duration": 600,
      "publishedAt": "2025-11-21T10:00:00Z",
      "channel": {
        "id": "clx456",
        "name": "Tech Channel",
        "handle": "tech-channel",
        "avatarUrl": "/uploads/avatars/avatar.jpg"
      }
    }
  ],
  "channels": [
    {
      "id": "clx456",
      "name": "Tech Channel",
      "handle": "tech-channel",
      "description": "Technology tutorials",
      "avatarUrl": "/uploads/avatars/avatar.jpg",
      "bannerUrl": "/uploads/banners/banner.jpg",
      "_count": {
        "videos": 25,
        "subscribers": 150
      }
    }
  ],
  "query": "tutorial"
}
```

**Search Logic**:
- Videos: Searches in title, description, and tags
- Channels: Searches in name, handle, and description
- Case-insensitive partial matching
- Results limited to 20 videos and 10 channels by default

**Error Response** (400):
```json
{
  "error": "Search query is required"
}
```

---

## Analytics APIs

### Analytics data is fetched server-side on the analytics page.

**Data Sources**:
- View events from `ViewEvent` table
- Video records from `Video` table
- Comment records from `Comment` table

**Metrics Calculated**:
- Total views (sum of view events)
- Total videos (count of video records)
- Total comments (count of comment records)
- Average watch time (sum of duration × views / total views)
- Views by date (last 30 days)
- Top performing videos (sorted by view count)

**No direct API endpoint** - Data is computed server-side in the page component.

---

## Utility APIs

### GET /api/geolocation

Get user location from IP address.

**Endpoint**: `/api/geolocation`

**Method**: `GET`

**Authentication**: Not required

**Request Headers**:
- `x-forwarded-for`: Client IP (if behind proxy)
- `x-real-ip`: Client IP (alternative header)

**Success Response** (200):
```json
{
  "success": true,
  "location": {
    "country": "United States",
    "city": "San Francisco",
    "region": "California",
    "countryCode": "US",
    "timezone": "America/Los_Angeles",
    "location": "San Francisco, United States"
  }
}
```

**Fallback Response** (if geolocation fails):
```json
{
  "success": true,
  "location": {
    "country": "Unknown",
    "city": "Unknown",
    "region": "Unknown",
    "countryCode": "Unknown",
    "timezone": "Unknown",
    "location": "Unknown"
  }
}
```

**Implementation**:
- Uses ipapi.co service for IP geolocation
- Extracts IP from request headers
- Falls back gracefully if service unavailable
- Used during registration for auto-filling location

---

## Error Handling

### Standard Error Response Format

All APIs return errors in a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

### Common Error Messages

**Authentication Errors**:
- `"Please sign in before uploading."`
- `"Account not found"`
- `"Invalid credentials"`

**Validation Errors**:
- `"Title, description, and duration are required."`
- `"Email already registered"`
- `"Video file size exceeds 2GB limit."`

**Not Found Errors**:
- `"Video not found"`
- `"Channel not found"`
- `"Comment not found"`

---

## Rate Limiting

**Current Implementation**: No rate limiting (development)

**Production Recommendations**:
- Implement rate limiting per IP
- Limit uploads: 10 per hour per user
- Limit API calls: 100 per minute per IP
- Use middleware like `express-rate-limit` or `@upstash/ratelimit`

---

## CORS Configuration

**Current**: Same-origin only (Next.js default)

**Production**: Configure CORS if needed:
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

---

## Authentication Headers

### Session-Based Authentication

**How it works**:
1. User logs in via NextAuth
2. Session cookie set automatically
3. Subsequent requests include cookie
4. Server validates session via `auth()` helper

**No manual headers required** - NextAuth handles automatically.

### Example: Making Authenticated Requests

```typescript
// Client-side (automatic)
const response = await fetch('/api/upload-video', {
  method: 'POST',
  body: formData
  // Cookie sent automatically by browser
});

// Server-side (in API route)
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  // ... rest of handler
}
```

---

## File Upload Guidelines

### Supported File Types

**Videos**:
- MP4 (recommended)
- MOV
- AVI
- WebM

**Images** (thumbnails, profile photos):
- JPEG
- PNG
- WebP
- GIF

### File Size Limits

- **Videos**: 2GB maximum
- **Images**: No hard limit (recommended < 5MB for thumbnails, < 2MB for profile photos)

### Upload Best Practices

1. **Client-Side Validation**:
   - Check file size before upload
   - Validate file type
   - Show progress indicator

2. **Server-Side Validation**:
   - Always validate on server
   - Check file size again
   - Verify file type
   - Sanitize filename

3. **Storage**:
   - Use unique filenames
   - Preserve file extension
   - Store in organized directories

---

## Testing APIs

### Using cURL

**Register User**:
```bash
curl -X POST http://localhost:3000/api/register \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "password=password123"
```

**Upload Video** (with session cookie):
```bash
curl -X POST http://localhost:3000/api/upload-video \
  -H "Cookie: next-auth.session-token=..." \
  -F "title=Test Video" \
  -F "description=Test description" \
  -F "videoFile=@/path/to/video.mp4" \
  -F "duration=120"
```

**Search**:
```bash
curl "http://localhost:3000/api/search?q=tutorial&limit=10"
```

### Using Postman

1. Import collection (if available)
2. Set base URL: `http://localhost:3000`
3. For authenticated requests:
   - Login first to get session cookie
   - Use cookie in subsequent requests

---

## API Versioning

**Current**: No versioning (v1 implicit)

**Future**: Consider versioning for breaking changes:
- `/api/v1/upload-video`
- `/api/v2/upload-video`

---

**Document Version**: 1.0  
**Last Updated**: November 2025

