# Video Data Synchronization Guide

This guide explains how to synchronize video files, thumbnails, and related data in the database.

## Overview

The video synchronization process ensures:
- ✅ All videos have valid `videoUrl` and `thumbnailUrl`
- ✅ VideoQuality records are properly linked to videos
- ✅ Orphaned records (comments, views, playlist videos) are cleaned up
- ✅ All relationships are correct
- ✅ Data URI thumbnails are converted to placeholder URLs for better performance

## Running the Sync Script

### Localhost

1. **Ensure your `.env` file has the correct DATABASE_URL:**
   ```bash
   DATABASE_URL="postgres://..."
   ```

2. **Run the sync script:**
   ```bash
   npm run db:sync-videos
   ```

### Vercel Deployment

The sync script can be run on Vercel using:
- **Vercel CLI** (if you have access to the deployment)
- **API Endpoint** (recommended): `POST /api/sync-videos`

#### Using the API Endpoint

1. **Make sure you're authenticated** (logged in)
2. **Call the API endpoint:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/sync-videos \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

   Or from the browser console:
   ```javascript
   fetch('/api/sync-videos', { method: 'POST' })
     .then(r => r.json())
     .then(console.log);
   ```

## What the Script Does

### 1. Validates Video URLs
- Checks that `videoUrl` is a valid HTTP/HTTPS URL or file path
- Ensures `videoUrl` is unique (handles duplicates)

### 2. Validates Thumbnail URLs
- Checks that `thumbnailUrl` is valid
- Converts data URI thumbnails to placeholder URLs
- Generates placeholder thumbnails for missing/invalid thumbnails

### 3. Syncs VideoQuality Records
- Creates an "original" quality record for videos that don't have one
- Removes orphaned VideoQuality records

### 4. Validates Relationships
- Ensures `channelId` references a valid channel
- Creates a default channel if needed (for orphaned videos)

### 5. Cleans Up Orphaned Records
- Removes comments without valid video references
- Removes view events without valid video references
- Removes playlist videos without valid video references
- Removes VideoQuality records without valid video references

## Output

The script provides detailed output:
- ✅ Videos that were fixed
- ⚠️ Videos with warnings
- ❌ Videos with errors
- Summary statistics

Example output:
```
📊 Synchronization Summary
============================================================
Total videos processed: 7
Videos fixed: 6
Videos with errors: 0
Videos OK: 7
============================================================

✅ All videos are synchronized and valid!
```

## Troubleshooting

### Error: "DATABASE_URL must start with postgresql:// or postgres://"

**Solution:** Update your `.env` file with the correct PostgreSQL connection string.

### Error: "Video has invalid channelId"

**Solution:** The script will try to assign a default channel. If no channels exist, create one first.

### Videos still have data URI thumbnails

**Solution:** Run the sync script again. It will convert all data URI thumbnails to placeholder URLs.

## Best Practices

1. **Run sync regularly** after bulk video uploads
2. **Run sync after migrations** that might affect video data
3. **Monitor the output** for any errors or warnings
4. **Backup your database** before running sync (especially in production)

## API Response Format

When using the API endpoint, you'll receive:

```json
{
  "success": true,
  "message": "Video synchronization completed",
  "summary": {
    "totalVideos": 7,
    "fixedCount": 6,
    "errorCount": 0,
    "errors": []
  }
}
```

## Notes

- The script is **idempotent** - safe to run multiple times
- It only **fixes** data, never deletes videos
- Data URI thumbnails are converted to placeholder URLs for better performance and compatibility
- The script works with both **localhost** and **Vercel** deployments (uses the same database)

