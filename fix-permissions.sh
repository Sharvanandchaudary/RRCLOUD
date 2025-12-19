#!/bin/bash
# Fix GitHub Actions Permissions for Container Registry

echo "🔧 Fixing GitHub Actions Permissions..."
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

echo "📋 Project: $PROJECT_ID"
echo "🔑 Service Account: $SA_EMAIL"
echo ""

# Add missing permissions
echo "Adding required permissions..."
echo ""

# Artifact Registry Admin (for pushing images)
echo "1️⃣  Adding Artifact Registry Writer..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer" \
  --quiet

# Container Registry Service Agent (for GCR)
echo "2️⃣  Adding Storage Admin (for GCR)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin" \
  --quiet

# Service Account Token Creator
echo "3️⃣  Adding Service Account Token Creator..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --quiet

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Permissions Updated!"
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
echo "🚀 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://github.com/Sharvanandchaudary/RRCLOUD/actions"
echo "2. Click on the failed workflow run"
echo "3. Click 'Re-run all jobs' button"
echo ""
echo "Or trigger new deployment:"
echo "  git commit --allow-empty -m 'Deploy with fixed permissions'"
echo "  git push origin main"
echo ""
