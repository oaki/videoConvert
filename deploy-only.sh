#!/bin/bash
set -e

PROJECT_ID="videoconvert-app"
REGION="europe-west1"
SERVICE_NAME="videoconvert"

echo "🚢 Deploying existing image to Cloud Run..."

gcloud run deploy "$SERVICE_NAME" \
    --image "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 3600 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production,PORT=8080,OUTPUT_FORMATS=mp4,webm,av1,MAX_UPLOAD_MB=1024,DELETE_ON_FAIL=false,MAX_RETRIES=3,SIGNED_URL_TTL_SEC=900,POLL_INTERVAL_MS=2000,NEXT_TELEMETRY_DISABLED=1,LOCAL_STORAGE_ROOT=/data \
    --set-secrets DATABASE_URL=DATABASE_URL:latest,SHADOW_DATABASE_URL=SHADOW_DATABASE_URL:latest

echo ""
echo "✅ Deployment complete!"
echo ""
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format "value(status.url)"

