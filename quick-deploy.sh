#!/bin/bash
set -e

PROJECT_ID="videoconvert-app"
REGION="europe-west1"
SERVICE_NAME="videoconvert"

echo "🚀 Quick Deploy - No build, just redeploy existing image..."
echo ""

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
    --update-env-vars NODE_ENV=production \
    --update-env-vars PORT=8080 \
    --update-env-vars OUTPUT_FORMATS=mp4,webm,av1 \
    --update-env-vars MAX_UPLOAD_MB=1024 \
    --update-env-vars DELETE_ON_FAIL=false \
    --update-env-vars MAX_RETRIES=3 \
    --update-env-vars SIGNED_URL_TTL_SEC=900 \
    --update-env-vars POLL_INTERVAL_MS=2000 \
    --update-env-vars NEXT_TELEMETRY_DISABLED=1 \
    --update-env-vars LOCAL_STORAGE_ROOT=/data \
    --update-secrets DATABASE_URL=DATABASE_URL:latest \
    --update-secrets SHADOW_DATABASE_URL=SHADOW_DATABASE_URL:latest

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Service URL:"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format "value(status.url)"

