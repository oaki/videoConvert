#!/bin/bash

PROJECT_ID="videoconvert-app"
REGION="europe-west1"
SERVICE_NAME="videoconvert"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "🚢 Deploying to Cloud Run..."
echo ""
echo "Image: $IMAGE"
echo "Region: $REGION"
echo ""

# Use simpler deploy without all flags
gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated

echo ""
echo "✅ Service deployed!"
echo ""
echo "Now setting environment variables and secrets..."
echo ""

# Update service with env vars and secrets
gcloud run services update "$SERVICE_NAME" \
    --region="$REGION" \
    --update-env-vars=NODE_ENV=production \
    --update-env-vars=PORT=8080 \
    --update-env-vars=OUTPUT_FORMATS=mp4,webm,av1 \
    --update-env-vars=MAX_UPLOAD_MB=1024 \
    --update-env-vars=DELETE_ON_FAIL=false \
    --update-env-vars=MAX_RETRIES=3 \
    --update-env-vars=SIGNED_URL_TTL_SEC=900 \
    --update-env-vars=POLL_INTERVAL_MS=2000 \
    --update-env-vars=NEXT_TELEMETRY_DISABLED=1 \
    --update-env-vars=LOCAL_STORAGE_ROOT=/data \
    --update-secrets=DATABASE_URL=DATABASE_URL:latest \
    --update-secrets=SHADOW_DATABASE_URL=SHADOW_DATABASE_URL:latest

echo ""
echo "✅ Configuration updated!"
echo ""
echo "🌐 Service URL:"
gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)"

