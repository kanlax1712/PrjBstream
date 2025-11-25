# Fix: 413 Content Too Large Error

## Problem
Getting `413 (Content Too Large)` error when uploading videos.

## Cause
Vercel serverless functions have a default 4.5MB body size limit. Video files are much larger.

## Solution Applied

### 1. Updated `next.config.ts`
- Added `serverActions.bodySizeLimit: '2gb'` for large file uploads

### 2. Updated `vercel.json`
- Increased memory allocation for upload-video route
- Set maxDuration to 300 seconds

### 3. Updated API Route
- Added runtime and maxDuration exports

## Alternative: Use Vercel Blob Direct Upload

For very large files (>100MB), consider using Vercel Blob's direct upload from client:

```typescript
import { put } from '@vercel/blob';

// In client component
const blob = await put(file.name, file, {
  access: 'public',
});
```

Then send only the blob URL to your API.

## Current Limits

- **Body Size**: 2GB (configured)
- **Function Duration**: 300 seconds (5 minutes)
- **Memory**: 3008 MB (for upload route)

## After Deployment

After these changes are deployed, video uploads up to 2GB should work!

---

**Note**: For production with very large files, consider:
1. Chunked uploads
2. Direct Blob upload from client
3. Background processing queue

