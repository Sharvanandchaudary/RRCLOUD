#!/bin/bash

# RRCloud GCP Deployment Script
# Usage: ./deploy.sh [project-id] [region]

set -e

PROJECT_ID=${1:-rrcloud-platform}
REGION=${2:-us-central1}

echo "🚀 Starting deployment to GCP Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Authenticate
echo "📝 Authenticating with GCP..."
gcloud config set project $PROJECT_ID

# Deploy Backend
echo "🔧 Building and deploying backend..."
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/rrcloud-backend
gcloud run deploy rrcloud-backend \
  --image gcr.io/$PROJECT_ID/rrcloud-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 5001 \
  --memory 512Mi

BACKEND_URL=$(gcloud run services describe rrcloud-backend --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# Deploy Frontend
cd ../frontend
echo "🎨 Building and deploying frontend..."
echo "REACT_APP_API_URL=$BACKEND_URL" > .env.production
gcloud builds submit --tag gcr.io/$PROJECT_ID/rrcloud-frontend
gcloud run deploy rrcloud-frontend \
  --image gcr.io/$PROJECT_ID/rrcloud-frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 80 \
  --memory 256Mi

FRONTEND_URL=$(gcloud run services describe rrcloud-frontend --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed: $FRONTEND_URL"

echo ""
echo "🎉 Deployment completed successfully!"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
