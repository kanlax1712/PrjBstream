# Bstream - Deployment Guide

## Document 5: Production Deployment Guide

### Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [File Storage Configuration](#file-storage-configuration)
5. [Deployment Platforms](#deployment-platforms)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Scaling Considerations](#scaling-considerations)

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All features tested locally
- [ ] No console errors or warnings
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables documented
- [ ] Secrets not committed to git
- [ ] `.env.example` file created
- [ ] README updated

### Security Review

- [ ] Strong `NEXTAUTH_SECRET` generated
- [ ] Database credentials secure
- [ ] File upload limits enforced
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection enabled
- [ ] HTTPS configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented

### Performance

- [ ] Database indexes created
- [ ] Image optimization enabled
- [ ] Caching strategy defined
- [ ] CDN configured (if applicable)
- [ ] Large files handled efficiently

---

## Environment Setup

### Production Environment Variables

Create `.env.production` file:

```env
# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host:5432/bstream?schema=public"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-strong-random-secret-here-min-32-chars"

# Node Environment
NODE_ENV="production"

# Optional: File Storage (if using cloud)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="bstream-uploads"

# Optional: Analytics
ANALYTICS_ID="your-analytics-id"

# Optional: Email Service (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-smtp-password"
```

### Generate Secure Secrets

**NEXTAUTH_SECRET**:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Database Password**:
- Use strong, unique password
- Store in secure password manager
- Never commit to git

---

## Database Migration

### From SQLite to PostgreSQL

#### Step 1: Set Up PostgreSQL Database

**Option A: Managed Service (Recommended)**
- AWS RDS
- Google Cloud SQL
- Supabase
- Railway PostgreSQL
- Neon

**Option B: Self-Hosted**
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql  # Linux

# Create database
createdb bstream
```

#### Step 2: Update Connection String

```env
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/bstream?schema=public"
```

#### Step 3: Update Prisma Schema

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

#### Step 4: Run Migrations

```bash
# Generate migration for PostgreSQL
npx prisma migrate dev --name migrate_to_postgres

# Apply to production database
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

#### Step 5: Verify Migration

```bash
# Check database
npx prisma studio
# Or connect directly
psql $DATABASE_URL
```

### Database Backup Strategy

**Automated Backups**:
- Daily full backups
- Weekly retention
- Monthly archives

**Manual Backup**:
```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20251121.sql
```

---

## File Storage Configuration

### Option 1: Cloud Storage (Recommended)

#### AWS S3 Setup

1. **Create S3 Bucket**:
   - Bucket name: `bstream-uploads`
   - Region: Choose closest to users
   - Block public access: Configure as needed

2. **Create IAM User**:
   - Programmatic access
   - Attach policy: `AmazonS3FullAccess` (or custom)

3. **Install AWS SDK**:
```bash
npm install @aws-sdk/client-s3
```

4. **Update Upload Handler**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadToS3(file: File, key: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }));
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
}
```

#### Cloudflare R2 Setup

1. **Create R2 Bucket**
2. **Generate API Token**
3. **Use S3-compatible API** (same code as S3)

#### Google Cloud Storage

1. **Create Storage Bucket**
2. **Create Service Account**
3. **Install SDK**:
```bash
npm install @google-cloud/storage
```

### Option 2: Local Storage (Not Recommended for Production)

**Only for small deployments**:
- Ensure sufficient disk space
- Set up automated backups
- Monitor disk usage
- Consider moving to cloud later

---

## Deployment Platforms

### Vercel (Recommended for Next.js)

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Deploy
```bash
vercel
```

#### Step 3: Configure Environment Variables
- Go to Vercel Dashboard
- Project → Settings → Environment Variables
- Add all production variables

#### Step 4: Configure Build Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

**Advantages**:
- Optimized for Next.js
- Automatic HTTPS
- Global CDN
- Easy rollbacks
- Preview deployments

### Railway

#### Step 1: Create Project
- Connect GitHub repository
- Select Node.js template

#### Step 2: Add PostgreSQL
- Add PostgreSQL service
- Copy connection string

#### Step 3: Configure Environment
- Add environment variables
- Set build command: `npm run build`
- Set start command: `npm start`

#### Step 4: Deploy
- Push to main branch (auto-deploys)
- Or deploy manually from dashboard

### AWS Amplify

#### Step 1: Connect Repository
- Connect GitHub/Bitbucket
- Select branch

#### Step 2: Configure Build
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

#### Step 3: Add Environment Variables
- Add in Amplify Console
- Include DATABASE_URL, NEXTAUTH_SECRET, etc.

### DigitalOcean App Platform

#### Step 1: Create App
- Connect repository
- Select Node.js

#### Step 2: Configure
- Build command: `npm run build`
- Run command: `npm start`
- Add PostgreSQL database
- Configure environment variables

### Docker Deployment

#### Create Dockerfile
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run
```bash
# Build
docker build -t bstream .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  bstream
```

---

## Post-Deployment

### Initial Setup Steps

1. **Verify Deployment**
   - Visit production URL
   - Check all pages load
   - Test authentication
   - Verify database connection

2. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed Initial Data** (Optional)
   ```bash
   npm run db:seed
   ```

4. **Test Critical Features**
   - User registration
   - Video upload
   - Search functionality
   - Comments
   - Subscriptions

### Domain Configuration

1. **Add Custom Domain**
   - Configure in platform dashboard
   - Add DNS records (A, CNAME)
   - Wait for propagation

2. **SSL Certificate**
   - Automatic with most platforms
   - Or use Let's Encrypt

3. **Update Environment Variables**
   ```env
   NEXTAUTH_URL="https://yourdomain.com"
   ```

---

## Monitoring & Maintenance

### Application Monitoring

**Recommended Tools**:
- **Vercel Analytics**: Built-in for Vercel
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **New Relic**: APM
- **Datadog**: Full-stack monitoring

### Database Monitoring

**PostgreSQL Monitoring**:
- Connection pool usage
- Query performance
- Slow query logs
- Disk usage

**Tools**:
- pgAdmin
- Postgres Insights (if using managed service)
- Custom dashboards

### Log Management

**Structured Logging**:
```typescript
// Use structured logging
console.log(JSON.stringify({
  level: 'error',
  message: 'Upload failed',
  userId: user.id,
  timestamp: new Date().toISOString()
}));
```

**Log Aggregation**:
- **Vercel**: Built-in logs
- **CloudWatch**: AWS
- **Logtail**: Simple logging
- **Papertrail**: Log management

### Health Checks

**Create Health Check Endpoint**:
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
```

**Monitor URL**: `https://yourdomain.com/api/health`

---

## Scaling Considerations

### Horizontal Scaling

**Stateless Application**:
- Next.js is stateless
- Can run multiple instances
- Use load balancer

**Session Management**:
- JWT sessions work across instances
- Or use Redis for session storage

### Database Scaling

**Connection Pooling**:
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings
}
```

**Read Replicas**:
- Use read replicas for queries
- Write to primary
- Read from replicas

### Caching Strategy

**CDN for Static Assets**:
- Images
- Videos (if using CDN)
- CSS/JS bundles

**Application Caching**:
- Redis for session storage
- Redis for frequently accessed data
- Cache API responses

**Database Query Caching**:
- Cache expensive queries
- Invalidate on updates
- Use Redis or Memcached

### Video Delivery

**Current**: Direct file serving (not scalable)

**Production Options**:
1. **CDN** (CloudFront, Cloudflare)
   - Cache videos at edge
   - Reduce origin load
   - Faster delivery

2. **Video Streaming Service**
   - Mux
   - Cloudflare Stream
   - AWS MediaConvert

3. **HLS/DASH Streaming**
   - Transcode to multiple qualities
   - Adaptive bitrate streaming
   - Better user experience

---

## Performance Optimization

### Build Optimization

**Next.js Config**:
```typescript
// next.config.ts
const nextConfig = {
  // Enable standalone output
  output: 'standalone',
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  
  // Compression
  compress: true,
  
  // Production source maps (optional)
  productionBrowserSourceMaps: false,
};
```

### Database Optimization

**Indexes**:
```prisma
model Video {
  // ... fields
  @@index([channelId])
  @@index([publishedAt])
  @@index([visibility, status])
  @@index([title]) // For search
}

model Channel {
  // ... fields
  @@index([ownerId])
  @@index([handle]) // Already unique
}

model Subscription {
  // ... fields
  @@unique([userId, channelId]) // Already indexed
}
```

**Query Optimization**:
- Use `select` to limit fields
- Paginate large results
- Use `take` and `skip`
- Avoid N+1 queries

### Image Optimization

**Next.js Image Component**:
- Automatic optimization
- Lazy loading
- Responsive images
- WebP/AVIF conversion

**CDN for Images**:
- Cloudinary
- Imgix
- ImageKit

---

## Security Hardening

### Security Headers

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};
```

### Rate Limiting

**Implement Rate Limiting**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Implement rate limiting logic
  // Use Upstash Redis or similar
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### File Upload Security

**Validation**:
- File type whitelist
- File size limits
- Virus scanning (ClamAV, etc.)
- Content validation

**Storage**:
- Outside web root (if possible)
- Signed URLs for access
- Access control lists
- Regular cleanup of orphaned files

---

## Backup & Recovery

### Database Backups

**Automated**:
- Daily full backups
- Point-in-time recovery
- Test restore procedures

**Manual**:
```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### File Backups

**Cloud Storage**:
- Versioning enabled
- Cross-region replication
- Lifecycle policies

**Local Storage**:
- Regular rsync to backup server
- Automated scripts
- Off-site backups

### Disaster Recovery Plan

1. **Document Recovery Procedures**
2. **Test Backups Regularly**
3. **Maintain Runbooks**
4. **Define RTO/RPO**
5. **Practice Drills**

---

## Cost Optimization

### Infrastructure Costs

**Database**:
- Use managed services (often cheaper)
- Right-size instances
- Use reserved instances for predictable workloads

**Storage**:
- Use lifecycle policies
- Archive old files
- Compress videos

**CDN**:
- Cache aggressively
- Use appropriate cache headers
- Monitor bandwidth

### Development Costs

**Free Tiers**:
- Vercel: Free tier available
- Railway: Free tier available
- Supabase: Free tier available

**Scaling Costs**:
- Monitor usage
- Set up alerts
- Optimize before scaling

---

## Maintenance Schedule

### Daily
- Monitor error rates
- Check disk usage
- Review logs

### Weekly
- Review performance metrics
- Check backup status
- Update dependencies (carefully)

### Monthly
- Security updates
- Database optimization
- Cost review
- Performance audit

### Quarterly
- Full security audit
- Disaster recovery test
- Capacity planning
- Documentation update

---

**Document Version**: 1.0  
**Last Updated**: November 2025

