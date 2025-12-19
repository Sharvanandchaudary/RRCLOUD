#!/bin/bash
# Enable Container Registry and Create Repository

echo "🔧 Setting up Container Registry..."
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

echo "📋 Project: $PROJECT_ID"
echo ""

# Enable Container Registry API
echo "1️⃣  Enabling Container Registry API..."
gcloud services enable containerregistry.googleapis.com --quiet

# Enable Artifact Registry API  
echo "2️⃣  Enabling Artifact Registry API..."
gcloud services enable artifactregistry.googleapis.com --quiet

# Enable Container Analysis API
echo "3️⃣  Enabling Container Analysis API..."
gcloud services enable containeranalysis.googleapis.com --quiet

echo ""
echo "   Waiting for APIs to activate (30 seconds)..."
sleep 30

# Add createOnPush permission
echo ""
echo "4️⃣  Adding createOnPush permission..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.repoAdmin" \
  --quiet

# Grant Storage Object Admin for GCR bucket
echo "5️⃣  Granting Storage permissions..."
gsutil iam ch serviceAccount:$SA_EMAIL:objectAdmin gs://artifacts.$PROJECT_ID.appspot.com 2>/dev/null || echo "   (Bucket will be created on first push)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Container Registry Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Current roles for $SA_EMAIL:"
echo ""
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SA_EMAIL" \
  --format="table(bindings.role)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Next: Re-run GitHub Actions deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "https://github.com/Sharvanandchaudary/RRCLOUD/actions"
echo ""
