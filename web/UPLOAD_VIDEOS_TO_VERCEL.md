# Upload Sample Videos to Vercel

## Quick Method: Direct Database Insert (Recommended)

This method directly inserts videos into the database (faster than API uploads).

### Step 1: Set Database URL

```bash
cd web

# Set your Vercel database URL
export DATABASE_URL="postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require"
```

### Step 2: Run Upload Script

```bash
npm run db:upload-videos
```

This will:
- ✅ Connect to your Vercel database
- ✅ Find or create a channel for the test user
- ✅ Upload 6 free sample videos from Google Cloud Storage
- ✅ Videos are immediately available on your site

### Step 3: Verify

Visit your Vercel deployment and you should see the sample videos!

---

## Videos That Will Be Uploaded

1. **Big Buck Bunny** - 10 min animated film
2. **Elephants Dream** - 11 min Blender film
3. **Sintel** - 15 min fantasy adventure
4. **Tears of Steel** - 12 min sci-fi film
5. **For Bigger Blazes** - 15 sec test video
6. **For Bigger Escapes** - 15 sec adventure video

All videos are from Google Cloud Storage (free, public domain).

---

## Requirements

- User `creator@bstream.dev` must exist (created by `npm run db:seed`)
- Database connection must be configured
- Channel will be auto-created if it doesn't exist

---

## Alternative: Via API (Slower)

If you prefer to use the API endpoint:

1. Login to your Vercel deployment
2. Use the upload form in the Studio
3. Or create a script that uses the `/api/upload-video` endpoint with proper authentication

---

**Ready? Run `npm run db:upload-videos` after setting DATABASE_URL!** 🚀

