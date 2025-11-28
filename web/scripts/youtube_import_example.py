#!/usr/bin/env python3
"""
YouTube Data API v3 - Import User Videos
This is a Python reference implementation for YouTube import functionality.

Prerequisites:
1. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Create OAuth 2.0 credentials in Google Cloud Console
3. Download client_secrets.json file
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import os

# YouTube Data API v3 scopes
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']

def authenticate():
    """Authenticate with Google OAuth 2.0"""
    creds = None
    
    # Check if token.json exists (saved credentials)
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If no valid credentials, run OAuth flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'client_secrets.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save credentials for next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    return creds

def get_my_channel_id(youtube):
    """Get the authenticated user's channel ID"""
    try:
        request = youtube.channels().list(
            part='id,contentDetails',
            mine=True
        )
        response = request.execute()
        
        if not response.get('items'):
            print("No channel found for this account.")
            return None
        
        channel_id = response['items'][0]['id']
        uploads_playlist_id = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        print(f"Channel ID: {channel_id}")
        print(f"Uploads Playlist ID: {uploads_playlist_id}\n")
        
        return channel_id, uploads_playlist_id
    except HttpError as error:
        print(f"An error occurred: {error}")
        return None

def get_my_videos(youtube, uploads_playlist_id):
    """Get all videos from user's uploads playlist"""
    try:
        videos = []
        next_page_token = None
        
        while True:
            # Get videos from uploads playlist
            request = youtube.playlistItems().list(
                part='snippet,contentDetails',
                playlistId=uploads_playlist_id,
                maxResults=50,
                pageToken=next_page_token
            )
            response = request.execute()
            
            if not response.get('items'):
                break
            
            # Extract video IDs
            video_ids = [item['contentDetails']['videoId'] for item in response['items']]
            
            # Get detailed video information
            videos_request = youtube.videos().list(
                part='snippet,contentDetails,statistics',
                id=','.join(video_ids)
            )
            videos_response = videos_request.execute()
            
            # Process each video
            for video in videos_response.get('items', []):
                snippet = video['snippet']
                content_details = video['contentDetails']
                
                # Parse duration (ISO 8601 format: PT1H2M10S)
                duration = parse_duration(content_details.get('duration', 'PT0S'))
                
                video_data = {
                    'id': video['id'],
                    'title': snippet.get('title', 'Untitled'),
                    'description': snippet.get('description', ''),
                    'thumbnailUrl': snippet['thumbnails']['high']['url'],
                    'duration': format_duration(duration),
                    'durationSeconds': duration,
                    'publishedAt': snippet.get('publishedAt', ''),
                    'url': f"https://www.youtube.com/watch?v={video['id']}",
                    'viewCount': video['statistics'].get('viewCount', '0'),
                    'likeCount': video['statistics'].get('likeCount', '0'),
                }
                videos.append(video_data)
            
            # Check for more pages
            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break
        
        return videos
    except HttpError as error:
        print(f"An error occurred: {error}")
        return []

def parse_duration(duration_str):
    """Parse ISO 8601 duration string to seconds"""
    import re
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return 0
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    
    return hours * 3600 + minutes * 60 + seconds

def format_duration(seconds):
    """Format seconds to HH:MM:SS or MM:SS"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"

def main():
    """Main function"""
    print("=" * 60)
    print("YouTube Data API v3 - Fetch User Videos")
    print("=" * 60)
    print()
    
    # Authenticate
    print("Step 1: Authenticating with Google...")
    creds = authenticate()
    print("✓ Authentication successful!\n")
    
    # Build YouTube API client
    print("Step 2: Building YouTube API client...")
    youtube = build('youtube', 'v3', credentials=creds)
    print("✓ API client ready!\n")
    
    # Get channel ID
    print("Step 3: Fetching channel information...")
    channel_info = get_my_channel_id(youtube)
    if not channel_info:
        print("Failed to get channel information.")
        return
    
    channel_id, uploads_playlist_id = channel_info
    print("✓ Channel information retrieved!\n")
    
    # Get videos
    print("Step 4: Fetching your uploaded videos...")
    videos = get_my_videos(youtube, uploads_playlist_id)
    print(f"✓ Found {len(videos)} videos!\n")
    
    # Display results
    print("=" * 60)
    print("Your YouTube Videos")
    print("=" * 60)
    print()
    
    for i, video in enumerate(videos, 1):
        print(f"{i}. {video['title']}")
        print(f"   URL: {video['url']}")
        print(f"   Duration: {video['duration']}")
        print(f"   Published: {video['publishedAt']}")
        print(f"   Views: {video['viewCount']}")
        print(f"   Likes: {video['likeCount']}")
        print()
    
    # Save to JSON file
    with open('youtube_videos.json', 'w') as f:
        json.dump(videos, f, indent=2)
    
    print(f"\n✓ Videos saved to youtube_videos.json")
    print(f"\nTotal: {len(videos)} videos")

if __name__ == '__main__':
    main()

