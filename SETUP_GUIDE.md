# Bstream - Complete Setup & Installation Guide

## Document 1: Setup & Installation

### System Requirements

#### Minimum Requirements
- **Operating System**: macOS 10.15+ or Windows 10+
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

#### Recommended Requirements
- **Operating System**: macOS 13+ or Windows 11+
- **Node.js**: Version 20.x LTS
- **RAM**: 16GB
- **Storage**: 10GB free space (for video uploads)
- **Internet**: Broadband connection

---

## Step-by-Step Installation

### Step 1: Verify Prerequisites

#### Check Node.js Installation
```bash
node --version
# Should show v18.0.0 or higher

npm --version
# Should show 9.0.0 or higher
```

#### Install Node.js (if not installed)
1. Visit https://nodejs.org/
2. Download LTS version for your OS
3. Run installer
4. Verify installation with commands above

### Step 2: Navigate to Project Directory

```bash
cd /Users/laxmikanth/Documents/Bstream/web
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages:
- Next.js and React
- Prisma ORM
- NextAuth.js
- Tailwind CSS
- And 400+ other dependencies

**Expected Output**: 
```
added 427 packages, and audited 427 packages
```

### Step 4: Configure Environment Variables

Create a `.env` file in the `web` directory:

```bash
touch .env
```

Add the following content:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-me-in-production-use-random-string-here

# Optional: For production
# DATABASE_URL="postgresql://user:password@localhost:5432/bstream"
```

**Important**: 
- Change `NEXTAUTH_SECRET` to a random string in production
- Generate secret: `openssl rand -base64 32`

### Step 5: Set Up Database

#### Initialize Database Schema
```bash
npm run db:migrate
```

This creates:
- SQLite database file (`dev.db`)
- All required tables (User, Video, Channel, etc.)
- Indexes and relationships

**Expected Output**:
```
✔ Generated Prisma Client
Database migrations applied successfully
```

#### Seed Database (Optional but Recommended)
```bash
npm run db:seed
```

This creates:
- Demo user account
- Sample channel
- 3 sample videos
- Sample playlist

**Demo Credentials**:
- Email: `creator@bstream.dev`
- Password: `watchmore`

### Step 6: Create Upload Directories

```bash
mkdir -p public/uploads/videos
mkdir -p public/uploads/profiles
mkdir -p public/uploads/thumbnails
```

### Step 7: Start Development Server

```bash
npm run dev
```

**Expected Output**:
```
▲ Next.js 16.0.3 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://172.x.x.x:3000

✓ Ready in 339ms
```

### Step 8: Access Application

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Verification Steps

### 1. Check Home Page
- Should display "Bstream" logo
- Should show featured videos (if seeded)
- Navigation should be visible

### 2. Test Login
- Navigate to `/login`
- Use demo credentials:
  - Email: `creator@bstream.dev`
  - Password: `watchmore`
- Should redirect to home page after login

### 3. Test Registration
- Navigate to `/register`
- Fill out registration form
- Should create account and redirect to login

### 4. Test Video Upload
- Login and go to `/studio`
- Upload a test video
- Should appear in studio and home feed

### 5. Test Search
- Use search bar in top navigation
- Should show search results page

---

## Troubleshooting Installation

### Issue: `npm install` fails

**Solution 1**: Clear npm cache
```bash
npm cache clean --force
npm install
```

**Solution 2**: Delete node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database migration fails

**Solution**: Reset database
```bash
rm -f prisma/dev.db
npm run db:migrate
npm run db:seed
```

### Issue: Port 3000 already in use

**Solution**: Use different port
```bash
PORT=3001 npm run dev
```

### Issue: Prisma client errors

**Solution**: Regenerate Prisma client
```bash
npx prisma generate
```

### Issue: Camera access denied (Go Live)

**Solution**: 
- Use HTTPS (required for camera access)
- Check browser permissions
- Use Chrome or Firefox (better camera support)

---

## Development Workflow

### Daily Development

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Code Changes**
   - Edit files in `src/` directory
   - Changes auto-reload (Hot Module Replacement)

3. **Check for Errors**
   ```bash
   npm run lint
   ```

4. **View Database**
   ```bash
   npx prisma studio
   ```
   Opens database GUI at http://localhost:5555

### Database Changes

1. **Modify Schema**
   - Edit `prisma/schema.prisma`

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name migration_name
   ```

3. **Apply to Database**
   - Migration auto-applies in dev mode

### Testing Features

1. **Test User Flow**
   - Register → Login → Upload → View

2. **Test Search**
   - Search for videos and channels

3. **Test Subscriptions**
   - Subscribe to channels
   - View subscription feed

4. **Test Playlists**
   - Create playlist
   - Add videos
   - View playlist

---

## Project Structure Explained

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── auth/          # Authentication
│   │   │   ├── upload-video/  # Video upload
│   │   │   ├── search/        # Search API
│   │   │   └── ...
│   │   ├── actions/           # Server actions
│   │   │   ├── videos.ts      # Video actions
│   │   │   ├── comments.ts    # Comment actions
│   │   │   └── ...
│   │   ├── register/          # Registration page
│   │   ├── login/             # Login page
│   │   ├── studio/            # Creator studio
│   │   ├── go-live/           # Live streaming
│   │   └── ...
│   ├── components/            # React components
│   │   ├── layout/            # Layout components
│   │   ├── navigation/         # Nav components
│   │   ├── video/             # Video components
│   │   └── ...
│   ├── lib/                   # Utilities
│   │   ├── auth.ts            # Auth config
│   │   ├── prisma.ts          # DB client
│   │   └── format.ts          # Format helpers
│   └── data/                  # Data fetching
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.mjs              # Seed script
├── public/
│   └── uploads/              # User uploads
├── .env                      # Environment variables
├── package.json              # Dependencies
└── next.config.ts            # Next.js config
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `NEXTAUTH_URL` | Base URL for auth callbacks | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Random 32+ char string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

---

## Next Steps After Installation

1. **Explore the Application**
   - Browse home page
   - Watch sample videos
   - Test search functionality

2. **Create Your Account**
   - Register at `/register`
   - Complete profile
   - Upload profile photo

3. **Create Content**
   - Go to Studio (`/studio`)
   - Upload your first video
   - Add description and tags

4. **Explore Features**
   - Subscribe to channels
   - Create playlists
   - Add comments
   - View analytics

5. **Test Live Streaming**
   - Go to `/go-live`
   - Allow camera access
   - Test camera controls

---

## Production Deployment Preparation

### Before Deploying

1. **Update Environment Variables**
   - Use strong `NEXTAUTH_SECRET`
   - Set production `DATABASE_URL`
   - Update `NEXTAUTH_URL` to production domain

2. **Database Migration**
   - Switch to PostgreSQL
   - Run production migrations
   - Set up backups

3. **File Storage**
   - Move to cloud storage (S3, R2)
   - Update upload handlers
   - Configure CDN

4. **Security**
   - Enable HTTPS
   - Set up rate limiting
   - Configure CORS
   - Review security headers

5. **Performance**
   - Enable caching
   - Optimize images
   - Set up monitoring
   - Configure CDN

---

## Support

For issues or questions:
1. Check troubleshooting section
2. Review error logs
3. Check browser console
4. Review server terminal output

---

**Document Version**: 1.0  
**Last Updated**: November 2025

