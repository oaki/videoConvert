#!/bin/bash
set -e

# Configuration
PROJECT_ID="${GCLOUD_PROJECT_ID:-your-project-id}"
REGION="${GCLOUD_REGION:-europe-west1}"
SERVICE_NAME="videoconvert"

echo "🚀 Deploying to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📋 Setting project..."
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create secrets if they don't exist
echo "🔐 Creating/updating secrets..."
if ! gcloud secrets describe DATABASE_URL &> /dev/null; then
    echo "Creating DATABASE_URL secret..."
    echo -n "mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega" | \
        gcloud secrets create DATABASE_URL --data-file=-
else
    echo "Updating DATABASE_URL secret..."
    echo -n "mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega" | \
        gcloud secrets versions add DATABASE_URL --data-file=-
fi

if ! gcloud secrets describe SHADOW_DATABASE_URL &> /dev/null; then
    echo "Creating SHADOW_DATABASE_URL secret..."
    echo -n "mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash" | \
        gcloud secrets create SHADOW_DATABASE_URL --data-file=-
else
    echo "Updating SHADOW_DATABASE_URL secret..."
    echo -n "mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash" | \
        gcloud secrets versions add SHADOW_DATABASE_URL --data-file=-
fi

# Build and push the image
echo "🏗️  Building container image..."
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 3600 \
    --min-instances 0 \
    --max-instances 10 \
    --env-vars-file env-vars.yaml \
    --set-secrets DATABASE_URL=DATABASE_URL:latest,SHADOW_DATABASE_URL=SHADOW_DATABASE_URL:latest

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Service URL:"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format "value(status.url)"

