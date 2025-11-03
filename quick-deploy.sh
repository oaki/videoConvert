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
    --env-vars-file env-vars.yaml \
    --update-secrets DATABASE_URL=DATABASE_URL:latest,SHADOW_DATABASE_URL=SHADOW_DATABASE_URL:latest

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Service URL:"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format "value(status.url)"

