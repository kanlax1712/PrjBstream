# Bstream - Complete Features Documentation

## Document 2: Features & Functionality

### Table of Contents
1. [User Management](#user-management)
2. [Video Management](#video-management)
3. [Channel & Subscriptions](#channel--subscriptions)
4. [Comments System](#comments-system)
5. [Playlists](#playlists)
6. [Search Functionality](#search-functionality)
7. [Live Streaming](#live-streaming)
8. [Analytics Dashboard](#analytics-dashboard)

---

## User Management

### Registration System

#### Overview
Complete user registration with profile information, photo upload, and automatic location detection.

#### Features

**1. Profile Information**
- Full Name (required, 2-100 characters)
- Email Address (required, unique, validated)
- Password (required, minimum 6 characters)
- Password Confirmation (must match)

**2. Optional Profile Details**
- Age (optional, 13-120 years)
- Gender (optional: Male, Female, Other, Prefer not to say)
- Profile Photo (optional, image file upload)

**3. Automatic Location Detection**
- Country (detected from IP address)
- City (detected from IP address)
- Region (detected from IP address)
- Timezone (detected from IP address)
- Full Location String (auto-formatted)

#### User Flow

```
1. User visits /register
2. Form displays with all fields
3. Location automatically detected via IP
4. User fills required fields
5. Optional: Uploads profile photo
6. Optional: Enters age and gender
7. Submits form
8. Server validates data
9. Password hashed with bcrypt
10. User record created in database
11. Profile photo saved to /uploads/profiles/
12. Redirect to login with success message
```

#### Technical Details

**API Endpoint**: `POST /api/register`

**Request Format**: `multipart/form-data`

**Validation Rules**:
- Name: 2-100 characters
- Email: Valid email format, unique
- Password: Minimum 6 characters
- Age: 13-120 (if provided)
- Profile Photo: Image file, any size (recommended < 5MB)

**Response**:
```json
{
  "success": true,
  "message": "Account created successfully!",
  "userId": "cuid_string"
}
```

#### Location Detection

**API**: `GET /api/geolocation`

**Process**:
1. Client requests location on page load
2. Server extracts IP from request headers
3. Calls IP geolocation service (ipapi.co)
4. Returns location data
5. Auto-fills location fields in form

**Fallback**: If geolocation fails, fields remain empty (optional)

---

### Login System

#### Overview
Secure authentication using NextAuth.js with email/password credentials.

#### Features
- Email/password login
- Session management (JWT)
- Remember me functionality
- Redirect after login
- Success message after registration

#### User Flow

```
1. User visits /login
2. Enters email and password
3. Submits form
4. NextAuth validates credentials
5. Password verified with bcrypt
6. JWT session created
7. Session cookie set
8. User redirected to home/studio
```

#### Technical Details

**Authentication Provider**: NextAuth.js Credentials

**Session Strategy**: JWT (JSON Web Tokens)

**Password Security**: 
- Hashed with bcrypt (10 rounds)
- Never stored in plain text
- Verified on each login

---

## Video Management

### Video Upload

#### Overview
Complete video upload system supporting local file uploads up to 2GB with metadata management.

#### Features

**1. File Upload**
- Video file selection (MP4, MOV, etc.)
- File size validation (max 2GB)
- Client-side size check
- Server-side validation
- Progress indication

**2. Video Metadata**
- Title (required, 3-120 characters)
- Description (required, minimum 10 characters)
- Duration in seconds (required, minimum 5)
- Tags (optional, comma-separated)

**3. Thumbnail Management**
- Upload thumbnail image (optional)
- Or provide thumbnail URL (optional)
- Default thumbnail if none provided
- Image preview

**4. File Storage**
- Videos stored in `public/uploads/videos/`
- Unique filenames with timestamp
- Original extension preserved
- Sanitized filenames

#### User Flow

```
1. User navigates to /studio
2. Clicks "Upload new video"
3. Fills video metadata form
4. Selects video file (local)
5. Optionally uploads thumbnail or provides URL
6. Submits form
7. File uploaded to server
8. Video file saved to disk
9. Thumbnail saved (if uploaded)
10. Database record created
11. Page refreshes showing new video
```

#### Technical Details

**API Endpoint**: `POST /api/upload-video`

**Request Format**: `multipart/form-data`

**File Processing**:
- File received as FormData
- Validated for type and size
- Saved to `public/uploads/videos/`
- Filename: `video-{timestamp}-{sanitized-name}.{ext}`
- URL stored in database: `/uploads/videos/{filename}`

**Database Record**:
```typescript
{
  title: string,
  description: string,
  videoUrl: string,      // /uploads/videos/...
  thumbnailUrl: string,   // /uploads/thumbnails/... or URL
  duration: number,
  tags: string,
  status: "READY",
  visibility: "PUBLIC",
  channelId: string
}
```

---

### Video Playback

#### Overview
HTML5 video player with related videos, comments, and engagement features.

#### Features

**1. Video Player**
- HTML5 `<video>` element
- Standard controls (play, pause, volume, fullscreen)
- Responsive aspect ratio
- Auto-play on load (muted)

**2. Video Information**
- Title and description
- Channel name and handle
- Publication date (relative time)
- Duration display
- Tags display

**3. Engagement Features**
- Subscribe button (if logged in)
- Add to playlist button
- Comment section
- Related videos sidebar

**4. View Tracking**
- Automatic view count increment
- Tracks after 5 seconds of playback
- Records viewer ID (if logged in)
- Stores view timestamp

#### User Flow

```
1. User clicks video from feed
2. Navigates to /video/[videoId]
3. Video loads with metadata
4. Related videos load in sidebar
5. Comments load below video
6. User can play video
7. View tracked after 5 seconds
8. User can subscribe, comment, add to playlist
```

#### Technical Details

**View Tracking API**: `POST /api/track-view`

**Request**:
```json
{
  "videoId": "video_id"
}
```

**Process**:
- View event created in database
- Associated with video and viewer (if logged in)
- Used for analytics

---

## Channel & Subscriptions

### Channel System

#### Overview
Each user can create a channel to publish videos. Channels have profiles, avatars, and subscriber counts.

#### Features

**1. Channel Creation**
- Automatic channel creation on first video upload
- Channel name and handle
- Description
- Avatar and banner images

**2. Channel Profile**
- Channel name and handle
- Subscriber count
- Video count
- Channel description
- Avatar and banner display

**3. Subscription System**
- One-click subscribe/unsubscribe
- Subscription feed
- Mock subscriptions for testing

#### User Flow - Subscribe

```
1. User views video or channel
2. Sees "Subscribe" button
3. Clicks subscribe
4. Server action creates subscription record
5. Button changes to "Subscribed"
6. Channel appears in subscription feed
```

#### Technical Details

**Subscribe Action**: `subscribeToChannel(channelId)`

**Database Record**:
```typescript
{
  userId: string,
  channelId: string,
  createdAt: DateTime
}
```

**Unique Constraint**: One subscription per user-channel pair

---

### Subscription Feed

#### Overview
Personalized feed showing latest videos from subscribed channels.

#### Features
- Latest videos from all subscriptions
- Sorted by publication date
- Empty state with mock subscription option
- Channel information display

#### User Flow

```
1. User navigates to /subscriptions
2. System fetches all user subscriptions
3. Gets latest videos from each channel
4. Combines and sorts by date
5. Displays in video grid
6. User can watch videos
```

---

## Comments System

### Comment Features

#### Overview
Full-featured commenting system with real-time updates and user attribution.

#### Features

**1. Add Comments**
- Comment form on video pages
- Text input (max 1000 characters)
- Real-time validation
- Submit button with loading state

**2. Display Comments**
- All comments shown below video
- Sorted by newest first
- Author name and avatar
- Timestamp (relative time)
- Comment count display

**3. Comment Management**
- Only authenticated users can comment
- Comments linked to video and author
- Automatic timestamp
- Real-time page refresh after comment

#### User Flow

```
1. User watches video
2. Scrolls to comments section
3. Types comment in textarea
4. Clicks "Post comment"
5. Server validates and saves
6. Page refreshes showing new comment
7. Comment appears at top of list
```

#### Technical Details

**Action**: `addComment(formData)`

**Validation**:
- Content: 1-1000 characters
- User must be authenticated
- Video must exist

**Database Record**:
```typescript
{
  content: string,
  videoId: string,
  authorId: string,
  createdAt: DateTime
}
```

---

## Playlists

### Playlist Management

#### Overview
Users can create playlists to organize videos into collections.

#### Features

**1. Create Playlist**
- Title (required, unique per user)
- Description (optional)
- Public/Private toggle
- Creation form in playlists page

**2. Add Videos to Playlist**
- Dropdown on video pages
- Select playlist from user's playlists
- Add button
- Success confirmation

**3. View Playlist**
- All videos in playlist
- Sorted by order added
- Playlist metadata
- Owner information

**4. Playlist Display**
- List of user's playlists
- Video count per playlist
- Public/Private indicator
- Last updated time

#### User Flow - Create Playlist

```
1. User navigates to /playlists
2. Fills playlist creation form
3. Enters title and description
4. Selects public/private
5. Submits form
6. Playlist created in database
7. Appears in playlists list
```

#### User Flow - Add Video

```
1. User watches video
2. Sees "Add to Playlist" section
3. Selects playlist from dropdown
4. Clicks "Add to Playlist"
5. Video added to playlist
6. Success message shown
```

#### Technical Details

**Create Action**: `createPlaylist(formData)`

**Add Video Action**: `addVideoToPlaylist(playlistId, videoId)`

**Database Structure**:
- Playlist: Title, description, isPublic, ownerId
- PlaylistVideo: playlistId, videoId, order (junction table)

---

## Search Functionality

### Search Features

#### Overview
Comprehensive search across videos and channels with real-time results.

#### Features

**1. Search Interface**
- Search bar in top navigation
- Placeholder text
- Search icon
- Form submission on Enter

**2. Search Results**
- Videos matching query
- Channels matching query
- Results count display
- Separate sections for each type

**3. Search Criteria**
- Video title
- Video description
- Video tags
- Channel name
- Channel handle
- Channel description

**4. Results Display**
- Video cards with thumbnails
- Channel cards with avatars
- Click to view video/channel
- Sorted by relevance/date

#### User Flow

```
1. User types in search bar
2. Presses Enter or clicks search
3. Navigates to /search?q=query
4. Server searches database
5. Returns matching videos and channels
6. Results displayed in grid
7. User clicks result to view
```

#### Technical Details

**API Endpoint**: `GET /api/search?q=query&limit=20`

**Search Logic**:
- Case-insensitive search
- Partial matching
- Multiple field search (OR logic)
- Limited results (20 videos, 10 channels)

**Database Query**:
```sql
-- Videos
WHERE (title LIKE '%query%' OR 
       description LIKE '%query%' OR 
       tags LIKE '%query%')
AND visibility = 'PUBLIC'
AND status = 'READY'

-- Channels
WHERE (name LIKE '%query%' OR 
       handle LIKE '%query%' OR 
       description LIKE '%query%')
```

---

## Live Streaming

### Go Live Features

#### Overview
Live streaming interface with camera and microphone access for real-time broadcasting.

#### Features

**1. Camera Access**
- Request camera permission
- Video preview
- Multiple camera selection
- Start/stop camera controls

**2. Microphone Control**
- Audio input access
- Microphone selection
- Mute/unmute toggle
- Visual mute indicator

**3. Live Controls**
- "Go Live" button
- Live indicator (red pulsing dot)
- "End Stream" button
- Stream status display

**4. Device Management**
- List available cameras
- List available microphones
- Device selection dropdowns
- Device switching (when stopped)

#### User Flow

```
1. User navigates to /go-live
2. System requests camera/mic permissions
3. User allows permissions
4. Camera preview appears
5. User selects devices (optional)
6. Clicks "Start Camera"
7. Preview shows live feed
8. User clicks "Go Live"
9. Stream starts (UI indication)
10. User can mute/unmute mic
11. User clicks "End Stream" to stop
```

#### Technical Details

**Browser APIs Used**:
- `navigator.mediaDevices.getUserMedia()` - Camera/mic access
- `navigator.mediaDevices.enumerateDevices()` - Device listing
- `MediaStream` API - Stream management

**Production Integration** (Future):
- RTMP server connection
- WebRTC for low latency
- Live video database record
- Chat moderation system
- Stream key generation

**Current Implementation**:
- Local preview only
- No actual streaming server
- UI ready for integration

---

## Analytics Dashboard

### Analytics Features

#### Overview
Comprehensive analytics dashboard for creators to track channel performance.

#### Features

**1. Overview Statistics**
- Total Views (all-time)
- Total Videos (published count)
- Total Comments (engagement)
- Average Watch Time (calculated)

**2. Views Chart**
- Last 30 days view data
- Bar chart visualization
- Daily view counts
- Interactive hover tooltips

**3. Top Performing Videos**
- Ranked by view count
- Top 5 videos displayed
- Video title and metadata
- View and comment counts

**4. Performance Metrics**
- Views per video
- Engagement rate
- Watch time analysis
- Growth trends

#### User Flow

```
1. Creator navigates to /analytics
2. System fetches channel data
3. Calculates statistics
4. Gets view events (last 30 days)
5. Groups views by date
6. Gets top videos
7. Displays all metrics
8. Creator can analyze performance
```

#### Technical Details

**Data Aggregation**:
- Views: Count from ViewEvent table
- Videos: Count from Video table
- Comments: Count from Comment table
- Watch Time: Sum of (duration × views)

**Chart Data**:
- Views grouped by date
- Last 30 days only
- Bar height proportional to views
- Max views for scaling

**Top Videos Query**:
```typescript
videos.sort((a, b) => b._count.views - a._count.views).slice(0, 5)
```

---

## Feature Integration

### Complete User Journey

**New User**:
1. Visits homepage
2. Registers account
3. Completes profile
4. Browses videos
5. Subscribes to channels
6. Creates playlists
7. Uploads first video

**Content Creator**:
1. Logs in
2. Goes to Studio
3. Uploads videos
4. Manages content
5. Views analytics
6. Engages with comments
7. Goes live

**Viewer**:
1. Browses home feed
2. Searches content
3. Watches videos
4. Comments
5. Subscribes
6. Creates playlists
7. Views subscription feed

---

## Technical Specifications

### File Upload Limits
- Video: 2GB maximum
- Thumbnail: No specific limit (recommended < 5MB)
- Profile Photo: No specific limit (recommended < 2MB)

### Validation Rules
- Email: Standard email format
- Password: Minimum 6 characters
- Video Title: 3-120 characters
- Video Description: Minimum 10 characters
- Video Duration: Minimum 5 seconds
- Comment: 1-1000 characters

### Performance
- Page load: < 2 seconds
- Video upload: Depends on file size
- Search: < 500ms
- Database queries: Optimized with indexes

---

**Document Version**: 1.0  
**Last Updated**: November 2025

