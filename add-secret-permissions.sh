#!/bin/bash
set -e

PROJECT_NUMBER="48273776183"
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "🔐 Adding Secret Manager permissions..."
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

echo "Adding permission for DATABASE_URL..."
gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

echo ""
echo "Adding permission for SHADOW_DATABASE_URL..."
gcloud secrets add-iam-policy-binding SHADOW_DATABASE_URL \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

echo ""
echo "✅ Permissions added successfully!"
echo ""
echo "Verifying permissions..."
echo ""
echo "DATABASE_URL permissions:"
gcloud secrets get-iam-policy DATABASE_URL

echo ""
echo "SHADOW_DATABASE_URL permissions:"
gcloud secrets get-iam-policy SHADOW_DATABASE_URL

echo ""
echo "✅ All done! Now you can deploy with:"
echo "./redeploy.sh"

