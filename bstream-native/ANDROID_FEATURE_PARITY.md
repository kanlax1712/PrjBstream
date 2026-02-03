# Bstream Android ↔ Web Feature Parity

This doc aligns the **Bstream web app** (localhost:3000 / bstreamtest.vercel.app) with the **Android native app** so both offer the same experience.

## Web app structure (reference)

- **Home** – Hero video, "Trending now" (secondary videos), "Curated playlists", Insight cards (videos/channels/comments counts).
- **Search** – Search bar + voice; results: **Channels** section, then **Videos** section.
- **Live** – "Live & Recent": live streams (STARTING/LIVE), "Go Live" when signed in, then "Recent Uploads" (video grid).
- **Studio** (signed in) – Welcome, "Your Channels", "Latest releases" (my videos with update thumbnail, delete), "Upload new video" form.
- **Go Live** (signed in) – Go live client.
- **Subscriptions** (signed in) – Videos from subscribed channels.
- **Playlists** (signed in) – My playlists, create playlist.
- **Insights / Analytics** (signed in) – Total views, videos, comments, avg watch time, 30-day views chart, top videos.
- **Account** – Sign in; when signed in: Profile.
- **Video detail** – Player (quality, speed, PiP, fullscreen, mute, subscribe, likes/dislikes, pre-roll ad), comments, add to playlist, delete (owner), "More like this".

## Android implementation status (aligned with web)

| Feature | Web | Android | Notes |
|--------|-----|---------|--------|
| Home: Hero (Premiere) first | ✅ | ✅ | Single featured hero card |
| Home: "Trending now" + secondary | ✅ | ✅ | Section header + Fresh drops from the community |
| Home: "Curated playlists" + carousels | ✅ | ✅ | Section header + Finish in a weekend |
| Home: Insight cards (counts) | ✅ | ✅ | Always shown; Videos/channels/comments |
| Home: Empty state | ✅ | ✅ | "No videos yet. Head to the studio…" |
| Search: "Search results for X" + counts | ✅ | ✅ | X videos, Y channels |
| Search: Channels then Videos | ✅ | ✅ | Same as web |
| Live: "Live & Recent" + Go Live button (when signed in) | ✅ | ✅ | Live Now + Recent Uploads |
| Studio: Creator Studio welcome + Upload | ✅ | ✅ | Your Channels, Latest releases, Upload new video |
| Account: Sign in; Insights/Upload when signed in | ✅ | ✅ | SessionHolder |
| Login: email/password + Create account link | ✅ | ✅ | POST /api/auth/login, POST /api/register |
| Login: Sign in with Google | ✅ | ✅ | POST /api/auth/google (ID token); set GOOGLE_WEB_CLIENT_ID for app |
| Video player (quality, mute, PiP) | ✅ | ✅ | |
| Video: subscribe, likes, playback speed, ad | ✅ | 🔲 | When APIs/auth ready |
| Subscriptions / Playlists | ✅ | 🔲 | After auth |

## APIs used by Android

- `GET /api/feed` – hero, secondary, playlists, counts
- `GET /api/search?q=&limit=` – videos, channels
- `GET /api/live` – liveStreams, recentVideos (for Live screen)
- `POST /api/track-view` – body `{ videoId }`
- `POST /api/upload-video` – multipart (when signed in)
- `POST /api/auth/login` – body `{ email, password }`
- `POST /api/register` – multipart (name, email, password, age, gender)
- `POST /api/auth/google` – body `{ idToken }` (Google ID token from Android Sign-In)

Base URL: debug `http://10.0.2.2:3000/`, release `https://bstreamtest.vercel.app/`

## Sync checklist

- [x] Home: hero, trending, playlists, insight cards
- [x] Search: channels section, videos section, voice search
- [x] Live: live streams list, recent videos, "Go Live" CTA
- [x] Studio: welcome, channels, latest releases, upload entry
- [x] Account: sign in/out, Insights & Upload when signed in
- [x] Login: email/password, Create account, Sign in with Google (same as web)
- [ ] Video: subscribe, likes/dislikes, playback speed, pre-roll ad (needs auth/APIs)
- [ ] Video: comments, add to playlist, more like this (needs APIs)
- [ ] Subscriptions / Playlists (needs auth)
