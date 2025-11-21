# Bstream - Video Streaming Platform Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Setup & Installation Guide](#setup--installation-guide)
4. [Feature Documentation](#feature-documentation)
5. [Technical Workflow](#technical-workflow)
6. [API Documentation](#api-documentation)
7. [Deployment Guide](#deployment-guide)
8. [Database Schema](#database-schema)
9. [Security & Authentication](#security--authentication)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

Bstream is a full-featured video streaming platform similar to YouTube, built with modern web technologies. It supports video upload, playback, user subscriptions, comments, playlists, live streaming, and analytics.

### Key Features
- User authentication and registration
- Video upload and playback
- Channel subscriptions
- Comments system
- Playlists management
- Search functionality
- Live streaming with camera access
- Analytics dashboard
- User profiles with geolocation

---

## Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 16.0.3 (React 19)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **State Management**: React Hooks, Zustand
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: SQLite (Prisma ORM)
- **Authentication**: NextAuth.js v4
- **File Storage**: Local filesystem (`public/uploads/`)

### Database
- **ORM**: Prisma
- **Database**: SQLite (development)
- **Migrations**: Prisma Migrate

### Key Libraries
- `next-auth`: Authentication
- `prisma`: Database ORM
- `bcryptjs`: Password hashing
- `zod`: Schema validation
- `lucide-react`: Icons

---

## Setup & Installation Guide

### Prerequisites
- Node.js 18+ and npm
- Git
- macOS (for local development)

### Installation Steps

1. **Clone/Navigate to Project**
   ```bash
   cd /Users/laxmikanth/Documents/Bstream/web
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create `.env` file in the `web` directory:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-change-in-production
   ```

4. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed Database (Optional)**
   ```bash
   npm run db:seed
   ```
   This creates a demo user:
   - Email: `creator@bstream.dev`
   - Password: `watchmore`

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Access Application**
   Open browser to `http://localhost:3000`

### Project Structure
```
web/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── actions/      # Server actions
│   │   ├── register/     # Registration page
│   │   ├── login/        # Login page
│   │   ├── studio/       # Creator studio
│   │   ├── go-live/      # Live streaming
│   │   └── ...
│   ├── components/        # React components
│   ├── lib/              # Utilities (auth, prisma)
│   └── data/             # Data fetching functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.mjs         # Database seed script
├── public/
│   └── uploads/         # Uploaded files (videos, images)
└── package.json
```

---

## Feature Documentation

### 1. User Authentication

#### Registration
- **Route**: `/register`
- **Features**:
  - Email/password registration
  - Profile photo upload
  - Age and gender (optional)
  - Automatic location detection via IP
  - Form validation

#### Login
- **Route**: `/login`
- **Features**:
  - Email/password authentication
  - Session management
  - Redirect after login

#### Authentication Flow
1. User submits credentials
2. Server validates with NextAuth
3. JWT session created
4. User redirected to home/studio

### 2. Video Management

#### Upload Video
- **Route**: `/studio`
- **API**: `POST /api/upload-video`
- **Features**:
  - Local file upload (up to 2GB)
  - Thumbnail upload or URL
  - Title, description, tags
  - Duration input
  - Automatic file storage

#### Video Playback
- **Route**: `/video/[videoId]`
- **Features**:
  - HTML5 video player
  - Related videos
  - Comments section
  - Subscribe button
  - Add to playlist

### 3. Subscriptions

#### Subscribe to Channel
- **Action**: `subscribeToChannel(channelId)`
- **Features**:
  - One-click subscription
  - Subscription feed
  - Mock subscriptions for testing

#### Subscription Feed
- **Route**: `/subscriptions`
- Shows latest videos from subscribed channels

### 4. Comments System

#### Add Comment
- **Action**: `addComment(formData)`
- **Features**:
  - Real-time comment display
  - Author information
  - Timestamps
  - Comment validation

### 5. Playlists

#### Create Playlist
- **Route**: `/playlists`
- **Action**: `createPlaylist(formData)`
- **Features**:
  - Public/private playlists
  - Title and description
  - Add videos to playlists

#### View Playlist
- **Route**: `/playlist/[playlistId]`
- Shows all videos in playlist

### 6. Search

#### Search Functionality
- **Route**: `/search?q=query`
- **API**: `GET /api/search`
- **Features**:
  - Search videos by title, description, tags
  - Search channels by name, handle
  - Results page with filters

### 7. Live Streaming

#### Go Live
- **Route**: `/go-live`
- **Features**:
  - Camera and microphone access
  - Device selection
  - Live preview
  - Mic mute/unmute
  - Live indicator

### 8. Analytics

#### Analytics Dashboard
- **Route**: `/analytics`
- **Features**:
  - Total views, videos, comments
  - Average watch time
  - 30-day views chart
  - Top performing videos

---

## Technical Workflow

### Video Upload Workflow

1. **User selects video file** (client-side)
   - File size validation (max 2GB)
   - File type validation

2. **Form submission** (client → API)
   - FormData sent to `/api/upload-video`
   - Includes video file, metadata

3. **Server processing** (API route)
   - Authentication check
   - Form validation (Zod)
   - File storage (`public/uploads/`)
   - Database record creation

4. **Response** (API → client)
   - Success/error message
   - Page refresh to show new video

### Authentication Workflow

1. **Registration**
   ```
   User fills form → POST /api/register
   → Hash password → Create user record
   → Redirect to login
   ```

2. **Login**
   ```
   User submits credentials → NextAuth authorize()
   → Verify password → Create JWT session
   → Set cookie → Redirect
   ```

3. **Protected Routes**
   ```
   Request → auth() check → Session validation
   → Allow/Redirect to login
   ```

### Comment Workflow

1. **Add Comment**
   ```
   User types comment → Submit form
   → Server action validates → Create comment record
   → Revalidate page → Show new comment
   ```

### Subscription Workflow

1. **Subscribe**
   ```
   Click subscribe → Server action
   → Check existing subscription → Create record
   → Update UI → Refresh feed
   ```

---

## API Documentation

### Authentication APIs

#### POST /api/register
Register new user account.

**Request Body** (FormData):
- `name`: string (required)
- `email`: string (required)
- `password`: string (required, min 6 chars)
- `age`: number (optional)
- `gender`: string (optional)
- `profilePhoto`: File (optional)
- `location`: string (auto-filled)
- `country`: string (auto-filled)
- `city`: string (auto-filled)

**Response**:
```json
{
  "success": true,
  "message": "Account created successfully!",
  "userId": "user_id"
}
```

#### POST /api/auth/[...nextauth]
NextAuth authentication endpoint.

### Video APIs

#### POST /api/upload-video
Upload video file.

**Request Body** (FormData):
- `title`: string (required)
- `description`: string (required)
- `videoFile`: File (required)
- `thumbnailFile`: File (optional)
- `thumbnailUrl`: string (optional)
- `duration`: number (required, min 5)
- `tags`: string (optional)

**Response**:
```json
{
  "success": true,
  "message": "Video uploaded successfully!",
  "videoId": "video_id"
}
```

#### POST /api/track-view
Track video view.

**Request Body**:
```json
{
  "videoId": "video_id"
}
```

### Search API

#### GET /api/search?q=query&limit=20
Search videos and channels.

**Response**:
```json
{
  "videos": [...],
  "channels": [...],
  "query": "search term"
}
```

### Geolocation API

#### GET /api/geolocation
Get user location from IP.

**Response**:
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

---

## Deployment Guide

### Production Checklist

1. **Environment Variables**
   ```env
   DATABASE_URL="postgresql://..." # Use PostgreSQL in production
   NEXTAUTH_URL="https://yourdomain.com"
   NEXTAUTH_SECRET="strong-random-secret"
   ```

2. **Database**
   - Migrate from SQLite to PostgreSQL
   - Run migrations: `npx prisma migrate deploy`

3. **File Storage**
   - Move from local filesystem to cloud storage (S3, Cloudflare R2)
   - Update upload handlers

4. **Build**
   ```bash
   npm run build
   npm start
   ```

5. **Deployment Platforms**
   - Vercel (recommended for Next.js)
   - AWS Amplify
   - Railway
   - DigitalOcean App Platform

### Production Optimizations

- Use CDN for video delivery
- Implement video transcoding
- Add caching layers
- Set up monitoring
- Configure rate limiting
- Enable HTTPS
- Set up backup strategy

---

## Database Schema

### User Model
```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  image         String?
  bio           String?
  age           Int?
  gender        String?
  location      String?
  country       String?
  city          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // Relations...
}
```

### Video Model
```prisma
model Video {
  id           String   @id @default(cuid())
  title        String
  description  String
  videoUrl     String   @unique
  thumbnailUrl String
  duration     Int
  tags         String
  visibility   VideoVisibility @default(PUBLIC)
  status       VideoStatus @default(READY)
  publishedAt  DateTime @default(now())
  channelId    String
  // Relations...
}
```

### Channel Model
```prisma
model Channel {
  id          String   @id @default(cuid())
  name        String
  handle      String   @unique
  description String?
  avatarUrl   String?
  bannerUrl   String?
  ownerId     String
  // Relations...
}
```

### Subscription Model
```prisma
model Subscription {
  id        String   @id @default(cuid())
  userId    String
  channelId String
  createdAt DateTime @default(now())
  @@unique([userId, channelId])
}
```

### Comment Model
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  videoId   String
  authorId  String
  // Relations...
}
```

### Playlist Model
```prisma
model Playlist {
  id          String   @id @default(cuid())
  title       String   @unique
  description String?
  isPublic    Boolean  @default(true)
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // Relations...
}
```

---

## Security & Authentication

### Authentication
- NextAuth.js with JWT sessions
- Password hashing with bcrypt (10 rounds)
- Protected API routes
- Session management

### Security Best Practices
- Input validation (Zod schemas)
- SQL injection prevention (Prisma)
- XSS protection (React escaping)
- CSRF protection (NextAuth)
- File upload validation
- Rate limiting (recommended for production)

### File Upload Security
- File type validation
- File size limits (2GB)
- Secure file storage
- Filename sanitization

---

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check `.env` file exists
   - Verify `DATABASE_URL` is correct
   - Run `npx prisma generate`

2. **Video Upload Fails**
   - Check file size (max 2GB)
   - Verify `public/uploads/` directory exists
   - Check server logs for errors

3. **Authentication Issues**
   - Verify `NEXTAUTH_SECRET` is set
   - Check session cookies
   - Clear browser cache

4. **Camera Access Denied**
   - Check browser permissions
   - Use HTTPS in production (required for camera)
   - Verify device permissions in OS

5. **Location Not Detected**
   - Geolocation API may be rate-limited
   - Check network connectivity
   - Location is optional, registration still works

### Debug Commands

```bash
# Check database status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database
npx prisma studio

# Check Prisma client
npx prisma generate
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database commands
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npx prisma studio     # Database GUI
npx prisma generate   # Generate Prisma client
```

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Author**: Bstream Development Team

