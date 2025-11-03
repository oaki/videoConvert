#!/bin/bash
set -e

PROJECT_ID="videoconvert-app"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "🔐 Adding Secret Manager permissions..."
echo "Project: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

# Add Secret Manager Secret Accessor role
gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding SHADOW_DATABASE_URL \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

echo ""
echo "✅ Permissions added!"
echo ""
echo "Now redeploy your Cloud Run service (it should work now)"

