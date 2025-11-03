# Video Convert - Project Structure

## 📁 Directory Structure

```
videoConvert/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── assets/
│   │   │   └── [assetId]/
│   │   │       └── download/     # Download asset with token
│   │   ├── health/               # Health check endpoint
│   │   ├── process-video/        # 🆕 Video processing trigger
│   │   ├── version/              # Version info endpoint
│   │   └── videos/
│   │       ├── route.ts          # List/Upload videos (triggers processing)
│   │       └── [id]/
│   │           ├── route.ts      # Get video details
│   │           ├── assets/       # List video assets
│   │           ├── poster/       # Get poster image
│   │           └── retry/        # Retry failed processing
│   ├── upload/                   # Upload page UI
│   ├── video/
│   │   └── [id]/                 # Video details page UI
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── lib/                          # Shared libraries
│   ├── config.ts                 # Configuration loader
│   ├── prisma.ts                 # Prisma client singleton
│   ├── storage.ts                # Storage abstraction layer
│   ├── tokens.ts                 # Download token utilities
│   └── video-processor.ts        # 🆕 Core video processing logic
│
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Database models
│   └── migrations/               # Migration history
│
├── types/                        # TypeScript types
│   └── dto.ts                    # Data transfer objects
│
├── data/                         # Local storage (development)
│   └── videos/                   # Uploaded video files
│
├── Dockerfile.web                # Main application Dockerfile
├── docker-compose.yml            # Local Docker development
├── cloudbuild.yaml               # Google Cloud Build config
├── service.yaml                  # Cloud Run service config
├── .env                          # Local environment variables
├── .env.docker                   # Docker environment variables
└── package.json                  # Dependencies & scripts
```

## 🔑 Key Files

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/videos` | GET | List all videos |
| `/api/videos` | POST | Upload video (auto-triggers processing) |
| `/api/videos/[id]` | GET | Get video details |
| `/api/videos/[id]/assets` | GET | List video assets |
| `/api/videos/[id]/poster` | GET | Get poster image (from DB or file) |
| `/api/videos/[id]/retry` | POST | Retry failed video processing |
| `/api/process-video` | POST | 🆕 Trigger video processing |
| `/api/assets/[assetId]/download` | GET | Download asset with token |
| `/api/health` | GET | Health check |
| `/api/version` | GET | API version info |

### Core Libraries

| File | Purpose |
|------|---------|
| `lib/config.ts` | Load & validate environment variables |
| `lib/prisma.ts` | Prisma client singleton pattern |
| `lib/storage.ts` | File storage abstraction (local/cloud) |
| `lib/tokens.ts` | Signed download token generation |
| `lib/video-processor.ts` | 🆕 Video transcoding & asset generation |

### Database Models

```prisma
Video
├── id (cuid)
├── title, originalName, mimeType
├── status (UPLOADED → QUEUED → PROCESSING → READY/FAILED)
├── retryCount, maxRetries
└── assets[] (relation)

Asset
├── id (cuid)
├── videoId (foreign key)
├── type (ORIGINAL, TRANSCODED, PREVIEW_CLIP, POSTER, FRAME)
├── format (MP4, WEBM, AV1)
├── path (storage key)
├── data (BLOB - for poster & preview)
├── byteSize, width, height, durationSec
└── tokens[] (relation)

DownloadToken
├── id (cuid)
├── assetId (foreign key)
├── tokenHash
└── expiresAt
```

## 🔄 Processing Flow

```
1. User uploads video
   ↓
2. POST /api/videos
   ├── Save to storage
   ├── Create Video record (status: QUEUED)
   ├── Create ORIGINAL asset
   └── Trigger POST /api/process-video
       ↓
3. processVideo() function
   ├── Update status → PROCESSING
   ├── Generate transcoded versions (MP4, WEBM, AV1)
   ├── Create 10-second preview clip → save to DB
   ├── Extract 10 frames
   ├── Generate poster → save to DB
   └── Update status → READY
       ↓
4. Client polls GET /api/videos/[id]
   └── Returns assets when status = READY
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
# Uploads & processes videos locally
# Storage: ./data/videos/
```

### Docker
```bash
docker compose up --build
# Single container running Next.js app
# No separate worker needed
```

### Google Cloud Run
```bash
./deploy.sh
# Deploys single service
# Processing runs within the same container
# Max timeout: 60 minutes
```

## 📊 Asset Storage Strategy

| Asset Type | Storage Location | Reason |
|------------|------------------|--------|
| ORIGINAL | File system | Large files |
| TRANSCODED | File system | Large files |
| FRAMES | File system | Multiple files |
| POSTER | Database (BLOB) | Small, frequently accessed |
| PREVIEW_CLIP | Database (BLOB) | Small (10s, 400x400) |

## 🔐 Environment Variables

### Required
- `DATABASE_URL` - MySQL connection string
- `SHADOW_DATABASE_URL` - Shadow DB for migrations
- `LOCAL_STORAGE_ROOT` - Storage path (e.g., `/data`)

### Optional
- `OUTPUT_FORMATS` - Transcode formats (default: `mp4,webm,av1`)
- `MAX_UPLOAD_MB` - Upload limit (default: `1024`)
- `MAX_RETRIES` - Processing retry limit (default: `3`)
- `DELETE_ON_FAIL` - Delete files on failure (default: `false`)
- `SIGNED_URL_TTL_SEC` - Token expiry (default: `900`)

## 📝 Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Start production server
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:deploy    # Deploy migrations (prod)
```

---

**Last Updated:** November 3, 2025  
**Architecture:** Single-service (worker integrated)

