#!/bin/bash
set -e

echo "🚀 Deploying changes to Cloud Run..."
echo ""

# 1. Commit changes to git (optional but recommended)
echo "📋 Git status:"
git status --short
echo ""

read -p "Do you want to commit changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Commit message: " commit_msg
    git add .
    git commit -m "$commit_msg"
    echo "✅ Changes committed"
fi

# 2. Build new image
echo ""
echo "🏗️  Building new Docker image..."
gcloud builds submit --tag gcr.io/videoconvert-app/videoconvert

# 3. Deploy to Cloud Run
echo ""
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy videoconvert \
    --image gcr.io/videoconvert-app/videoconvert:latest \
    --region europe-west1 \
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
echo "🌐 Service URL:"
gcloud run services describe videoconvert --region europe-west1 --format 'value(status.url)'
echo ""
echo "📊 View logs:"
echo "gcloud run services logs tail videoconvert --region europe-west1"

