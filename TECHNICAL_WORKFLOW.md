# Bstream - Technical Workflow Documentation

## Document 3: Technical Workflows & Architecture

### Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Authentication Workflow](#authentication-workflow)
4. [Video Upload Workflow](#video-upload-workflow)
5. [Search Workflow](#search-workflow)
6. [Live Streaming Workflow](#live-streaming-workflow)
7. [Database Operations](#database-operations)
8. [API Request/Response Flow](#api-requestresponse-flow)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React UI   │  │  Next.js App │  │   Forms      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │
┌─────────────────────────────────────────────────────────┐
│              Next.js Server (Node.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  API Routes  │  │ Server Actions│ │  Auth Layer  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  File Upload │  │   Validation │  │   Routing    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Prisma     │  │  File System │  │  NextAuth   │
│   ORM        │  │   Storage    │  │   Sessions  │
└───────┬──────┘  └──────────────┘  └────────────┘
        │
┌───────▼──────┐
│   SQLite     │
│   Database   │
└──────────────┘
```

### Component Architecture

```
Application Layer
├── Pages (Next.js App Router)
│   ├── Home Page (/)
│   ├── Login Page (/login)
│   ├── Register Page (/register)
│   ├── Studio Page (/studio)
│   ├── Video Page (/video/[id])
│   ├── Search Page (/search)
│   └── ...
│
├── API Routes
│   ├── /api/auth/[...nextauth]
│   ├── /api/register
│   ├── /api/upload-video
│   ├── /api/search
│   ├── /api/track-view
│   └── /api/geolocation
│
├── Server Actions
│   ├── createVideoAction
│   ├── addComment
│   ├── subscribeToChannel
│   ├── createPlaylist
│   └── ...
│
└── Components
    ├── Layout Components
    ├── Navigation Components
    ├── Video Components
    ├── Form Components
    └── ...
```

---

## Data Flow Diagrams

### Video Upload Flow

```
User Action
    │
    ▼
[Select Video File]
    │
    ▼
[Fill Metadata Form]
    │
    ▼
[Submit Form]
    │
    ├─► Client Validation
    │   └─► File Size Check
    │
    ▼
[POST /api/upload-video]
    │
    ├─► Authentication Check
    │   └─► Verify Session
    │
    ├─► Form Validation
    │   └─► Zod Schema Validation
    │
    ├─► File Processing
    │   ├─► Save Video File
    │   └─► Save Thumbnail (if provided)
    │
    ├─► Database Operation
    │   └─► Create Video Record
    │
    └─► Response
        ├─► Success Message
        └─► Video ID
```

### Authentication Flow

```
Registration Flow:
User → /register → Fill Form → POST /api/register
    → Validate Data → Hash Password → Create User
    → Save Profile Photo → Return Success
    → Redirect to /login

Login Flow:
User → /login → Enter Credentials → signIn()
    → NextAuth authorize() → Verify Password
    → Create JWT Session → Set Cookie
    → Redirect to Home/Studio

Session Check:
Request → auth() → Get Session from Cookie
    → Verify JWT → Return User Data
    → Allow/Deny Access
```

### Search Flow

```
User Input
    │
    ▼
[Type in Search Bar]
    │
    ▼
[Submit Search]
    │
    ▼
[GET /api/search?q=query]
    │
    ├─► Parse Query
    │
    ├─► Database Queries
    │   ├─► Search Videos
    │   │   └─► WHERE (title, description, tags) LIKE query
    │   └─► Search Channels
    │       └─► WHERE (name, handle, description) LIKE query
    │
    └─► Return Results
        ├─► Videos Array
        └─► Channels Array
```

---

## Authentication Workflow

### Detailed Authentication Process

#### 1. Registration Process

```
Step 1: Client Request
┌─────────────────────────────────────┐
│ User fills registration form        │
│ - Name, Email, Password             │
│ - Optional: Age, Gender, Photo     │
│ - Location auto-detected           │
└─────────────────────────────────────┘
              │
              ▼
Step 2: Form Submission
┌─────────────────────────────────────┐
│ FormData created                    │
│ - All form fields                   │
│ - Profile photo file (if any)       │
└─────────────────────────────────────┘
              │
              ▼
Step 3: API Request
┌─────────────────────────────────────┐
│ POST /api/register                  │
│ Content-Type: multipart/form-data    │
└─────────────────────────────────────┘
              │
              ▼
Step 4: Server Processing
┌─────────────────────────────────────┐
│ 1. Parse FormData                    │
│ 2. Validate with Zod schema          │
│ 3. Check email uniqueness            │
│ 4. Hash password (bcrypt, 10 rounds) │
│ 5. Save profile photo (if provided)  │
│ 6. Create user record                │
└─────────────────────────────────────┘
              │
              ▼
Step 5: Response
┌─────────────────────────────────────┐
│ { success: true, userId: "..." }    │
└─────────────────────────────────────┘
              │
              ▼
Step 6: Client Redirect
┌─────────────────────────────────────┐
│ Redirect to /login?registered=true  │
└─────────────────────────────────────┘
```

#### 2. Login Process

```
Step 1: User Input
┌─────────────────────────────────────┐
│ User enters email and password      │
└─────────────────────────────────────┘
              │
              ▼
Step 2: NextAuth SignIn
┌─────────────────────────────────────┐
│ signIn("credentials", {             │
│   email, password, redirect: false  │
│ })                                   │
└─────────────────────────────────────┘
              │
              ▼
Step 3: NextAuth Authorize
┌─────────────────────────────────────┐
│ authorize() function called          │
│ 1. Find user by email               │
│ 2. Compare password with hash       │
│ 3. Return user object if valid      │
└─────────────────────────────────────┘
              │
              ▼
Step 4: JWT Creation
┌─────────────────────────────────────┐
│ jwt() callback                      │
│ - Add user ID to token              │
│ - Add user name to token            │
│ - Return token                      │
└─────────────────────────────────────┘
              │
              ▼
Step 5: Session Creation
┌─────────────────────────────────────┐
│ session() callback                  │
│ - Add user ID to session            │
│ - Add user name to session           │
│ - Return session object              │
└─────────────────────────────────────┘
              │
              ▼
Step 6: Cookie Set
┌─────────────────────────────────────┐
│ Set httpOnly cookie                  │
│ - Contains encrypted session        │
│ - Secure flag (HTTPS)               │
│ - SameSite protection               │
└─────────────────────────────────────┘
              │
              ▼
Step 7: Redirect
┌─────────────────────────────────────┐
│ Redirect to callbackUrl or "/"      │
└─────────────────────────────────────┘
```

#### 3. Session Validation

```
Every Protected Route Request:
┌─────────────────────────────────────┐
│ Request arrives                      │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ auth() function called               │
│ - Reads session cookie              │
│ - Decrypts JWT                      │
│ - Validates token                   │
│ - Returns session or null           │
└─────────────────────────────────────┘
              │
        ┌─────┴─────┐
        │           │
    Valid        Invalid
        │           │
        ▼           ▼
┌───────────┐  ┌───────────┐
│ Allow     │  │ Redirect  │
│ Access    │  │ to /login │
└───────────┘  └───────────┘
```

---

## Video Upload Workflow

### Complete Upload Process

```
Phase 1: Client-Side Preparation
┌─────────────────────────────────────┐
│ 1. User selects video file          │
│ 2. Client validates file size       │
│    - Check against 2GB limit        │
│    - Show error if too large        │
│ 3. User fills metadata             │
│    - Title, description, duration   │
│    - Tags, thumbnail                │
│ 4. Form submission                  │
└─────────────────────────────────────┘
              │
              ▼
Phase 2: Network Transfer
┌─────────────────────────────────────┐
│ POST /api/upload-video               │
│ - FormData with file and metadata   │
│ - Multipart encoding                │
│ - Large file transfer (streaming)   │
└─────────────────────────────────────┘
              │
              ▼
Phase 3: Server-Side Processing
┌─────────────────────────────────────┐
│ 1. Authentication Check             │
│    - Verify user session            │
│    - Get user ID                    │
│                                      │
│ 2. Form Validation                  │
│    - Parse FormData                  │
│    - Validate with Zod schema       │
│    - Check required fields          │
│                                      │
│ 3. File Validation                  │
│    - Verify file exists             │
│    - Check file size                │
│    - Validate file type             │
│                                      │
│ 4. Channel Lookup                  │
│    - Find user's channel            │
│    - Create if doesn't exist        │
│                                      │
│ 5. File Storage                     │
│    - Generate unique filename       │
│    - Save video to disk             │
│    - Save thumbnail (if provided)  │
│                                      │
│ 6. Database Operation              │
│    - Create Video record            │
│    - Link to channel               │
│    - Set status to READY            │
│                                      │
│ 7. Cache Invalidation              │
│    - Revalidate home page          │
│    - Revalidate studio page        │
└─────────────────────────────────────┘
              │
              ▼
Phase 4: Response
┌─────────────────────────────────────┐
│ Return JSON response                 │
│ {                                    │
│   success: true,                     │
│   message: "Video uploaded...",      │
│   videoId: "..."                     │
│ }                                    │
└─────────────────────────────────────┘
              │
              ▼
Phase 5: Client Update
┌─────────────────────────────────────┐
│ 1. Show success message             │
│ 2. Reset form                       │
│ 3. Refresh page                     │
│ 4. Display new video in studio      │
└─────────────────────────────────────┘
```

### File Storage Structure

```
public/uploads/
├── videos/
│   ├── video-1699123456789-sample-video.mp4
│   ├── video-1699123567890-another-video.mp4
│   └── ...
├── profiles/
│   ├── profile-1699123456789-user-photo.jpg
│   └── ...
└── thumbnails/
    ├── thumb-1699123456789-thumbnail.jpg
    └── ...
```

---

## Search Workflow

### Search Implementation

```
User Query Input
    │
    ▼
[Search Bar Component]
    │
    ├─► Form Submission
    │   └─► GET /search?q=query
    │
    └─► API Call (Alternative)
        └─► GET /api/search?q=query
            │
            ▼
[Search API Route]
    │
    ├─► Parse Query String
    │   └─► Extract search term
    │
    ├─► Database Queries (Parallel)
    │   │
    │   ├─► Video Search
    │   │   └─► Prisma Query:
    │   │       WHERE (
    │   │         title LIKE '%query%' OR
    │   │         description LIKE '%query%' OR
    │   │         tags LIKE '%query%'
    │   │       )
    │   │       AND visibility = 'PUBLIC'
    │   │       AND status = 'READY'
    │   │       ORDER BY publishedAt DESC
    │   │       LIMIT 20
    │   │
    │   └─► Channel Search
    │       └─► Prisma Query:
    │           WHERE (
    │             name LIKE '%query%' OR
    │             handle LIKE '%query%' OR
    │             description LIKE '%query%'
    │           )
    │           LIMIT 10
    │
    └─► Combine Results
        │
        ▼
[Search Results Page]
    │
    ├─► Display Channels Section
    │   └─► Channel cards with avatars
    │
    └─► Display Videos Section
        └─► Video grid with thumbnails
```

### Search Optimization

**Indexes** (Recommended for Production):
```sql
CREATE INDEX idx_video_title ON Video(title);
CREATE INDEX idx_video_tags ON Video(tags);
CREATE INDEX idx_channel_name ON Channel(name);
CREATE INDEX idx_channel_handle ON Channel(handle);
```

---

## Live Streaming Workflow

### Camera Access Flow

```
User Action: Navigate to /go-live
    │
    ▼
[Page Load]
    │
    ├─► Enumerate Devices
    │   └─► navigator.mediaDevices.enumerateDevices()
    │       ├─► Get cameras
    │       └─► Get microphones
    │
    └─► Display Device Selection
        │
        ▼
[User Clicks "Start Camera"]
    │
    ▼
[Request Media Access]
    │
    ├─► navigator.mediaDevices.getUserMedia({
    │       video: { deviceId: selectedCamera },
    │       audio: { deviceId: selectedMic }
    │     })
    │
    └─► Browser Permission Dialog
        │
        ├─► User Allows
        │   └─► MediaStream created
        │       └─► Display in <video> element
        │
        └─► User Denies
            └─► Show error message
                │
                ▼
[Camera Active State]
    │
    ├─► Video Preview Displayed
    │
    ├─► Controls Available
    │   ├─► Stop Camera
    │   ├─► Mute/Unmute Mic
    │   └─► Go Live Button
    │
    └─► User Clicks "Go Live"
        │
        ▼
[Live State] (UI Only - No Server Connection Yet)
    │
    ├─► Live Indicator Shown
    │
    ├─► Stream Status Displayed
    │
    └─► End Stream Button Available
```

### Production Streaming Integration (Future)

```
Current: Local Preview Only
    │
    ▼
Production: RTMP/WebRTC Integration
    │
    ├─► Generate Stream Key
    │   └─► Unique key per user/session
    │
    ├─► Connect to Streaming Server
    │   ├─► RTMP: rtmp://server/live/streamkey
    │   └─► WebRTC: WebSocket connection
    │
    ├─► Encode Video Stream
    │   └─► H.264 encoding
    │
    ├─► Transmit to Server
    │   └─► Real-time streaming
    │
    ├─► Server Processing
    │   ├─► Receive stream
    │   ├─► Transcode (multiple qualities)
    │   ├─► Distribute via CDN
    │   └─► Create live video record
    │
    └─► Viewer Access
        └─► HLS/DASH playback
```

---

## Database Operations

### Common Database Patterns

#### 1. Create Operations

```typescript
// Create User
await prisma.user.create({
  data: {
    name: "John Doe",
    email: "john@example.com",
    passwordHash: hashedPassword,
    // ... other fields
  }
});

// Create Video
await prisma.video.create({
  data: {
    title: "My Video",
    description: "Description",
    videoUrl: "/uploads/videos/video.mp4",
    channelId: channel.id,
    // ... other fields
  }
});
```

#### 2. Read Operations

```typescript
// Find Unique
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});

// Find Many with Filters
const videos = await prisma.video.findMany({
  where: {
    visibility: "PUBLIC",
    status: "READY"
  },
  include: {
    channel: true
  },
  orderBy: { publishedAt: "desc" },
  take: 20
});
```

#### 3. Update Operations

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    name: "New Name",
    bio: "New bio"
  }
});
```

#### 4. Delete Operations

```typescript
await prisma.comment.delete({
  where: { id: commentId }
});
```

#### 5. Complex Queries

```typescript
// Get subscription feed
const subscriptions = await prisma.subscription.findMany({
  where: { userId },
  include: {
    channel: {
      include: {
        videos: {
          where: { visibility: "PUBLIC" },
          orderBy: { publishedAt: "desc" },
          take: 10
        }
      }
    }
  }
});
```

---

## API Request/Response Flow

### Standard API Flow

```
Client Request
    │
    ▼
[HTTP Request]
    │
    ├─► Method: GET/POST/PUT/DELETE
    ├─► Headers: Authorization, Content-Type
    ├─► Body: JSON or FormData
    └─► Query Params: ?key=value
    │
    ▼
[Next.js API Route Handler]
    │
    ├─► Parse Request
    │   ├─► Extract headers
    │   ├─► Parse body
    │   └─► Get query params
    │
    ├─► Authentication
    │   └─► Verify session (if required)
    │
    ├─► Validation
    │   └─► Validate input (Zod)
    │
    ├─► Business Logic
    │   ├─► Database operations
    │   ├─► File operations
    │   └─► Data processing
    │
    └─► Response
        ├─► Success: 200/201
        ├─► Error: 400/401/404/500
        └─► JSON body
    │
    ▼
[Client Receives Response]
    │
    ├─► Parse JSON
    ├─► Update UI
    └─► Handle errors
```

### Error Handling Flow

```
Error Occurs
    │
    ▼
[Try-Catch Block]
    │
    ├─► Catch Error
    │
    ├─► Log Error
    │   └─► console.error()
    │
    ├─► Determine Error Type
    │   ├─► Validation Error → 400
    │   ├─► Authentication Error → 401
    │   ├─► Not Found → 404
    │   └─► Server Error → 500
    │
    └─► Return Error Response
        {
          success: false,
          message: "Error description"
        }
```

---

## Performance Optimization

### Caching Strategy

```
Static Assets
    │
    ├─► Images: Next.js Image Optimization
    ├─► Videos: CDN (production)
    └─► CSS/JS: Browser caching

Database Queries
    │
    ├─► Index frequently queried fields
    ├─► Use select to limit fields
    └─► Pagination for large datasets

API Responses
    │
    ├─► Cache static data
    ├─► Revalidate on update
    └─► Use Next.js revalidatePath()
```

### Database Indexes

```prisma
// Recommended indexes for production
model Video {
  // ... fields
  @@index([channelId])
  @@index([publishedAt])
  @@index([visibility, status])
}

model Channel {
  // ... fields
  @@index([ownerId])
}

model Subscription {
  // ... fields
  @@unique([userId, channelId])
}
```

---

## Security Workflow

### Input Validation Flow

```
User Input
    │
    ▼
[Client-Side Validation]
    │
    ├─► HTML5 validation
    ├─► JavaScript validation
    └─► File type/size checks
    │
    ▼
[Server-Side Validation]
    │
    ├─► Zod schema validation
    ├─► Type checking
    ├─► Length limits
    └─► Format validation
    │
    ▼
[Sanitization]
    │
    ├─► SQL injection prevention (Prisma)
    ├─► XSS prevention (React)
    └─► Filename sanitization
    │
    ▼
[Database Storage]
```

### File Upload Security

```
File Upload
    │
    ├─► Client Validation
    │   ├─► File type check
    │   └─► File size check
    │
    ├─► Server Validation
    │   ├─► Verify file type
    │   ├─► Check file size
    │   └─► Scan for malware (production)
    │
    ├─► Filename Sanitization
    │   ├─► Remove special characters
    │   ├─► Generate unique name
    │   └─► Preserve extension
    │
    └─► Secure Storage
        ├─► Outside web root (production)
        └─► Access control
```

---

**Document Version**: 1.0  
**Last Updated**: November 2025

