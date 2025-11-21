# Bstream - Video Streaming Platform

A full-featured video streaming platform built with Next.js, Prisma, and NextAuth.js. Similar to YouTube, with features for video upload, playback, subscriptions, comments, playlists, live streaming, and analytics.

## 🚀 Features

- **User Management**: Registration with profile photos, age, gender, and automatic location detection
- **Video Upload**: Upload videos up to 2GB with thumbnails and metadata
- **Video Playback**: HTML5 video player with view tracking
- **Subscriptions**: Subscribe to channels and view subscription feed
- **Comments**: Full commenting system with real-time updates
- **Playlists**: Create and manage video playlists
- **Search**: Search videos and channels
- **Live Streaming**: Camera access for live streaming (UI ready)
- **Analytics**: Dashboard with views, watch time, and engagement metrics

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **File Storage**: Local filesystem (dev) / Cloud storage (production)

## 📋 Prerequisites

- Node.js 18+ and npm
- Git
- PostgreSQL (for production)

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/bstream.git
cd bstream/web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

### Demo Credentials

- Email: `creator@bstream.dev`
- Password: `watchmore`

## 📚 Documentation

Complete documentation is available in the project root:

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete project documentation
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[FEATURES_DOCUMENTATION.md](./FEATURES_DOCUMENTATION.md)** - Feature guide
- **[TECHNICAL_WORKFLOW.md](./TECHNICAL_WORKFLOW.md)** - Technical architecture
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API documentation
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[GITHUB_DEPLOYMENT.md](./GITHUB_DEPLOYMENT.md)** - GitHub & Netlify setup

## 🌐 Deployment

### Deploy to Netlify

See [GITHUB_DEPLOYMENT.md](./GITHUB_DEPLOYMENT.md) for complete instructions.

**Quick Steps**:
1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables
4. Configure PostgreSQL database
5. Deploy!

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="production"
```

## 📁 Project Structure

```
bstream/
├── web/                    # Next.js application
│   ├── src/
│   │   ├── app/           # Pages and API routes
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   ├── prisma/            # Database schema and migrations
│   └── public/            # Static files
├── DOCUMENTATION.md        # Main documentation
├── SETUP_GUIDE.md         # Setup guide
├── FEATURES_DOCUMENTATION.md
├── TECHNICAL_WORKFLOW.md
├── API_REFERENCE.md
├── DEPLOYMENT_GUIDE.md
└── GITHUB_DEPLOYMENT.md
```

## 🧪 Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Database commands
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npx prisma studio     # Database GUI
```

## 🔒 Security

- Password hashing with bcrypt
- JWT session management
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- File upload validation

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, open an issue in the GitHub repository.

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for video streaming**

