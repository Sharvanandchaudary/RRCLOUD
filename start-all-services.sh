#!/bin/bash

echo "======================================="
echo "Starting All GCP Services"
echo "======================================="
echo ""

PROJECT_ID=$(gcloud config get-value project)
echo "Project: $PROJECT_ID"
echo ""

# Start Cloud SQL instances
echo "🗄️  Starting Cloud SQL instances..."
gcloud sql instances patch rrcloud-db --activation-policy=ALWAYS --quiet &
gcloud sql instances patch rrcloud-db-instance --activation-policy=ALWAYS --quiet &
wait

echo "✅ Cloud SQL instances starting..."
echo ""

# Wake up Cloud Run services by setting traffic to 100%
echo "🚀 Waking up Cloud Run services..."
echo ""

services=("rrcloud-api" "rrcloud-backend" "rrcloud-backend-test" "rrcloud-frontend" "simple-backend")

for service in "${services[@]}"; do
    echo "   - Starting $service..."
    gcloud run services update $service --region=us-central1 --quiet 2>/dev/null || echo "   ⚠️  $service might not exist or already active"
done

echo ""
echo "======================================="
echo "✅ All services started!"
echo "======================================="
echo ""
echo "Checking status..."
echo ""

# Check Cloud SQL status
echo "📊 Cloud SQL Instances:"
gcloud sql instances list --format="table(name,state,region)"

echo ""
echo "📊 Cloud Run Services:"
gcloud run services list --region=us-central1 --format="table(SERVICE,URL,LAST_DEPLOYED)"

echo ""
echo "✅ Startup complete!"
