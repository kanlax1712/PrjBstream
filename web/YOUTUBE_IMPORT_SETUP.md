# YouTube Import Setup Guide

## Overview
This feature allows users to import videos from their YouTube channel directly into Bstream using OAuth 2.0 authentication and YouTube Data API v3.

## Features Implemented

### 1. Two Upload Methods
- **Upload from Device**: Traditional file upload with pencil icon
- **Import from YouTube**: Import videos from user's YouTube channel with YouTube icon

### 2. Google OAuth 2.0 Integration
- Added Google provider to NextAuth
- Requests YouTube read-only scope
- Stores access tokens for API calls

### 3. YouTube Data API v3
- Fetches user's uploaded videos
- Displays video titles, thumbnails, and metadata
- Allows selection and import

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

For Vercel, add these in the Vercel dashboard under Project Settings > Environment Variables.

### Step 4: Install Dependencies

```bash
npm install googleapis
```

## How It Works

### User Flow

1. User clicks "Import from YouTube" button
2. If not authenticated, redirects to Google OAuth
3. User grants YouTube access permissions
4. System fetches user's YouTube videos
5. User selects videos to import
6. Videos are imported to Bstream with metadata

### API Endpoints

#### GET `/api/youtube/videos`
Fetches authenticated user's YouTube videos.

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "id": "video-id",
      "title": "Video Title",
      "description": "Video description",
      "thumbnailUrl": "https://...",
      "duration": "10:30",
      "publishedAt": "2024-01-01T00:00:00Z",
      "url": "https://www.youtube.com/watch?v=..."
    }
  ]
}
```

#### POST `/api/youtube/import`
Imports a selected YouTube video to Bstream.

**Request:**
```json
{
  "videoId": "youtube-video-id",
  "title": "Video Title",
  "description": "Description",
  "thumbnailUrl": "https://...",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "duration": "10:30"
}
```

## Components

### `YoutubeImportButton`
- Button component for initiating YouTube import
- Handles OAuth flow
- Shows loading states

### `YoutubeVideoSelector`
- Modal component displaying user's YouTube videos
- Allows video selection
- Handles import process

## Python Reference Implementation

If you need a standalone Python script for reference:

```python
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import json

SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']

def authenticate():
    flow = InstalledAppFlow.from_client_secrets_file(
        'client_secrets.json', SCOPES)
    creds = flow.run_local_server(port=0)
    return creds

def get_my_videos(creds):
    youtube = build('youtube', 'v3', credentials=creds)
    
    # Get channel ID
    channels_response = youtube.channels().list(
        part='contentDetails',
        mine=True
    ).execute()
    
    channel_id = channels_response['items'][0]['id']
    uploads_playlist_id = channels_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
    
    # Get videos from uploads playlist
    videos_response = youtube.playlistItems().list(
        part='snippet,contentDetails',
        playlistId=uploads_playlist_id,
        maxResults=50
    ).execute()
    
    video_ids = [item['contentDetails']['videoId'] for item in videos_response['items']]
    
    # Get video details
    videos_details = youtube.videos().list(
        part='snippet,contentDetails',
        id=','.join(video_ids)
    ).execute()
    
    videos = []
    for video in videos_details['items']:
        videos.append({
            'id': video['id'],
            'title': video['snippet']['title'],
            'description': video['snippet']['description'],
            'thumbnailUrl': video['snippet']['thumbnails']['high']['url'],
            'duration': video['contentDetails']['duration'],
            'publishedAt': video['snippet']['publishedAt'],
            'url': f"https://www.youtube.com/watch?v={video['id']}"
        })
    
    return videos

if __name__ == '__main__':
    creds = authenticate()
    videos = get_my_videos(creds)
    
    print(f"\nFound {len(videos)} videos:\n")
    for video in videos:
        print(f"Title: {video['title']}")
        print(f"URL: {video['url']}")
        print(f"Published: {video['publishedAt']}\n")
```

## Troubleshooting

### "Google account not connected"
- User needs to sign in with Google first
- Check that OAuth credentials are correct
- Verify redirect URI matches exactly

### "No YouTube channel found"
- User needs to have uploaded videos to their YouTube channel
- Check that YouTube Data API v3 is enabled

### "Authentication expired"
- Access tokens expire after 1 hour
- Refresh tokens are stored and used automatically
- User may need to re-authenticate

## Security Notes

- Access tokens are stored securely in the database
- Only YouTube read-only scope is requested
- Users can revoke access at any time via Google Account settings
- All API calls are server-side only

## Next Steps

1. Set up Google Cloud project
2. Add environment variables
3. Test OAuth flow
4. Import your first YouTube video!

