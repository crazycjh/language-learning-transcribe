# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

This is a YouTube Video Learning Platform built with Next.js 15 (App Router) that enables video transcription, interactive transcript viewing, and language learning features. The application combines frontend React components with backend API routes for file processing and AI integration.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The development server runs on **port 3500** (not the default 3000).

## Product Vision and Business Goals

### Long-term Vision
This application is designed with future monetization in mind. When implementing new features or making architectural decisions, consider the following business directions:

### Freemium Strategy
The application follows a freemium model designed to provide substantial value in the free tier while creating clear upgrade incentives:

**Free Tier (Core Value Proposition)**
- Basic YouTube video transcription (5 videos/month limit)
- Simple transcript viewing with timeline synchronization
- Basic dictation practice features
- Standard SRT export functionality
- Community support

**Premium Tier (Advanced Features)**
- Unlimited transcription and processing
- Batch processing capabilities
- Advanced AI analysis (difficulty assessment, learning recommendations)
- Multi-language support and translation
- Personalized learning paths and progress tracking
- High-quality exports (multiple formats, custom styling)
- Priority support and faster processing

### Potential Revenue Streams
- **Individual Subscriptions**: Monthly/yearly plans for personal users ($9.99/month, $99/year)
- **Professional Tools**: Advanced features for content creators ($29.99/month)
- **Educational Licenses**: Bulk pricing for schools and language centers ($199/month for 50 users)
- **API Services**: Developer access with usage-based pricing ($0.10/minute processed)
- **Enterprise Solutions**: Custom integrations and white-label options

### Design Principles for Scalability
- **User Management**: Plan for user accounts, subscription tiers, and usage tracking
- **API Rate Limiting**: Design APIs with future rate limiting and pricing tiers in mind
- **Data Analytics**: Implement usage tracking for product insights and billing
- **Modular Architecture**: Keep features modular for easy premium/freemium separation
- **Performance**: Optimize for scale as user base grows

### Technical Considerations
- Consider implementing user authentication and session management
- Design database schema with user data and subscription status in mind
- Plan for usage metrics and analytics collection
- Ensure APIs can support rate limiting and quota management

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with Shadcn/ui components (New York style)
- **Backend**: Next.js API routes
- **AI**: OpenAI API for transcription and content processing
- **Storage**: AWS S3/Cloudflare R2 for file uploads
- **Real-time**: Socket.io for progress updates and WebSocket communication

### Key Directories

```
app/                          # Next.js App Router
├── api/                      # Backend API endpoints
│   ├── openai/route.ts      # OpenAI integration
│   ├── sentence-split/      # Text processing
│   └── srt/[videoId]/       # SRT subtitle handling
├── videotranscript/         # Main transcription interface
├── vp/[videoId]/           # Video player pages
└── video-list/             # Video listing interface

components/                   # React components
├── ui/                      # Shadcn/ui components
├── YouTubePlayer.tsx        # Main video player
├── SrtTranscriptViewer.tsx  # Transcript display
└── DictationPractice.tsx    # Language learning features

lib/                         # Utilities and services
├── r2-service.ts           # Cloudflare R2 integration
├── socketManager.ts        # WebSocket management
├── srt-utils.ts           # SRT file processing
└── utils.ts               # General utilities
```

### Component Architecture

- **Functional Programming**: Uses React Hooks and functional components exclusively
- **TypeScript**: Strict mode enabled with build error ignoring in next.config.ts
- **Shadcn/ui**: Component library with aliases (`@/components`, `@/lib`, `@/hooks`)
- **Dark Theme**: Slate color scheme (`bg-slate-900`, `text-slate-100`)

### API Endpoints

- `/api/openai/` - OpenAI integration for transcription and content analysis
- `/api/sentence-split/` - AI-powered text segmentation
- `/api/srt/[videoId]/` - SRT file generation and management

### Real-time Features

- Socket.io client for progress tracking during transcription
- Real-time synchronization between video playback and transcript
- WebSocket connections managed through `lib/socketManager.ts`

### File Upload and Storage

- Cloudflare R2 integration via `lib/r2-service.ts`
- Local uploads stored in `uploads/` directory
- Support for YouTube videos and direct audio file uploads

### Key Components

- **YouTubePlayer.tsx**: Embedded video player with transcript synchronization
- **SrtTranscriptViewer.tsx**: Interactive transcript display with seeking
- **DictationPractice.tsx**: Language learning practice interface
- **VideoPlayerClient.tsx**: Client-side video player wrapper

### Development Notes

- Uses Turbopack for faster development builds
- TypeScript build errors are ignored (configured in next.config.ts)
- Shadcn/ui components use New York style with neutral base color
- Icon library: Lucide React
- Socket connections should be properly managed to avoid memory leaks