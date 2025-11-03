# Video Processing Integration ✅

## Overview

The video processing worker has been **integrated into the main Next.js application**. There is no longer a separate worker service to deploy.

## How It Works

### 1. Upload Flow
1. User uploads a video via `/api/videos` (POST)
2. Video is saved to storage and database with status `QUEUED`
3. Upload route automatically triggers `/api/process-video` endpoint
4. Processing runs asynchronously in the background

### 2. Processing Flow
The `/api/process-video` endpoint:
- Changes video status to `PROCESSING`
- Generates transcoded versions (MP4, WEBM, AV1)
- Creates 10-second preview clip (saved to database as BLOB)
- Extracts 10 frames across first 10 seconds
- Generates poster image (saved to database as BLOB)
- Sets status to `READY` on success or `FAILED` on error
- Supports automatic retries (configurable via `MAX_RETRIES`)

### 3. Key Files

**Processing Logic:**
- `lib/video-processor.ts` - Core video processing function (extracted from worker)

**API Routes:**
- `app/api/videos/route.ts` - Upload endpoint (triggers processing)
- `app/api/process-video/route.ts` - Processing endpoint
- `app/api/videos/[id]/route.ts` - Get video details
- `app/api/videos/[id]/assets/route.ts` - List video assets
- `app/api/videos/[id]/poster/route.ts` - Get poster image
- `app/api/videos/[id]/retry/route.ts` - Retry failed processing
- `app/api/assets/[assetId]/download/route.ts` - Download asset with token

## Architecture Benefits

✅ **Simpler Deployment** - Single service instead of two
✅ **No Worker Management** - No need to manage separate worker instances
✅ **Unified Codebase** - All code in one place
✅ **Cost Effective** - Only one Cloud Run service to pay for
✅ **Automatic Scaling** - Cloud Run handles concurrency automatically

## Configuration

Set these environment variables:

```bash
# Required
DATABASE_URL="mysql://..."
SHADOW_DATABASE_URL="mysql://..."

# Storage
LOCAL_STORAGE_ROOT=/data

# Processing Options
OUTPUT_FORMATS=mp4,webm,av1
MAX_RETRIES=3
DELETE_ON_FAIL=false

# Timeouts
MAX_UPLOAD_MB=1024
```

## Deployment

### Local Development

```bash
npm run dev
```

Upload a video and it will be processed automatically.

### Docker

```bash
docker compose up --build
```

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Or use the deploy script
./deploy.sh
```

The main application will handle both uploads and processing.

## Processing Timeout

Cloud Run has a maximum timeout of **60 minutes** for HTTP requests. For very large videos:

1. The processing endpoint returns immediately with status `processing`
2. Processing continues in the background
3. Client can poll `/api/videos/[id]` to check status

If a video takes longer than 60 minutes to process, you may need to:
- Split into smaller chunks
- Use a dedicated job queue service (Pub/Sub + Cloud Functions)
- Increase Cloud Run instance resources

## Retry Failed Videos

```bash
# Via API
curl -X POST https://your-app.run.app/api/videos/{videoId}/retry
```

Or use the UI to retry failed videos.

## Monitoring

Check logs in Cloud Run console:
```bash
gcloud run services logs read video-convert --region=us-central1
```

Look for these log patterns:
- `[UPLOAD]` - Upload progress
- `[PROCESS]` - Processing status
- `Processing video` - Worker function logs

---

**Migrated from worker service:** November 3, 2025

