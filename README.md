# Video Convert - Cloud Ready

Video transcoding service ready for Google Cloud Run deployment.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run database migrations:**
```bash
npx prisma migrate deploy
# or for development
npx prisma migrate dev
```

4. **Start development server:**
```bash
npm run dev
```

The application will:
- Accept video uploads on `http://localhost:3000/upload`
- Process videos automatically in the background
- Store transcoded assets and thumbnails in the database

### Docker Compose (Local Testing)

**Note:** Docker Compose now uses external database from `.env` file.

```bash
# Start services
docker compose up --build

# Stop services
docker compose down

# Remove volumes
docker compose down -v
```

## Architecture

**Single Service Design:**
- Web API and video processing run in the same Next.js application
- No separate worker service needed
- Processing triggered automatically after upload
- Runs asynchronously without blocking uploads

See [VIDEO_PROCESSING.md](./VIDEO_PROCESSING.md) for details.

## ☁️ Google Cloud Run Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy

```bash
# Set your project ID
export GCLOUD_PROJECT_ID="your-project-id"
export GCLOUD_REGION="europe-west1"

# Run deployment
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Configuration

All configuration is in `.env` file:

- `DATABASE_URL` - MySQL/MariaDB connection string
- `SHADOW_DATABASE_URL` - Shadow database for Prisma migrations
- `PORT` - Server port (3000 local, 8080 for Cloud Run)
- `OUTPUT_FORMATS` - Video output formats (mp4,webm,av1)
- `MAX_UPLOAD_MB` - Maximum upload size
- And more...

## 🏗️ Architecture

- **Web Service**: Next.js app handling API and UI
- **Worker Service**: Background video processing (Docker Compose only)
- **Database**: External MySQL/MariaDB (WebSupport)
- **Storage**: Local filesystem (configurable)

## 📝 Important Notes

⚠️ **Cloud Run Storage**: Files are ephemeral. For production, use Cloud Storage.

⚠️ **Worker Process**: Cloud Run is HTTP-based. Consider Cloud Run Jobs or Cloud Tasks for background processing.

## 🛠️ Scripts

- `npm run dev` - Development server
- `npm run build` - Build production
- `npm run start` - Start production server
- `npx prisma migrate dev` - Create migration
- `npx prisma migrate deploy` - Apply migrations
- `npx prisma studio` - Database GUI

## 🔄 Queue System

Database-based queue using MySQL. Worker polls for videos with status 'QUEUED' every 2 seconds (configurable via POLL_INTERVAL_MS).

## 📄 License

Private



