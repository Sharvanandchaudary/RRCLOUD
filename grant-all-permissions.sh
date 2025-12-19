#!/bin/bash
# Grant ALL Required Permissions for GitHub Actions

echo "🔐 Granting ALL GitHub Actions Permissions..."
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

echo "📋 Project: $PROJECT_ID"
echo "🔑 Service Account: $SA_EMAIL"
echo ""

# Enable ALL required APIs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Enabling APIs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gcloud services enable cloudresourcemanager.googleapis.com --quiet
gcloud services enable iam.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
gcloud services enable artifactregistry.googleapis.com --quiet
gcloud services enable containeranalysis.googleapis.com --quiet
gcloud services enable storage.googleapis.com --quiet
gcloud services enable sqladmin.googleapis.com --quiet
gcloud services enable compute.googleapis.com --quiet

echo "✅ All APIs enabled"
echo ""
echo "Waiting 30 seconds for APIs to propagate..."
sleep 30
echo ""

# Grant ALL required roles
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Granting Roles..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ROLES=(
  "roles/run.admin"
  "roles/iam.serviceAccountUser"
  "roles/storage.admin"
  "roles/cloudsql.client"
  "roles/artifactregistry.writer"
  "roles/artifactregistry.repoAdmin"
  "roles/artifactregistry.admin"
  "roles/iam.serviceAccountTokenCreator"
  "roles/cloudbuild.builds.editor"
  "roles/viewer"
)

for ROLE in "${ROLES[@]}"; do
  echo "  Adding: $ROLE"
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" \
    --quiet 2>/dev/null
done

echo ""
echo "✅ All roles granted"
echo ""

# Initialize GCR bucket
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Initializing Container Registry..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Push a dummy image to create the bucket
docker pull hello-world 2>/dev/null || echo "Docker not available (OK, will create on first push)"
docker tag hello-world gcr.io/$PROJECT_ID/init:latest 2>/dev/null || true
docker push gcr.io/$PROJECT_ID/init:latest 2>/dev/null || echo "  (Bucket will be auto-created on first deployment push)"

# Grant bucket permissions
echo ""
echo "  Granting bucket permissions..."
gsutil iam ch serviceAccount:$SA_EMAIL:objectAdmin gs://artifacts.$PROJECT_ID.appspot.com 2>/dev/null || echo "  (Will be set on bucket creation)"
gsutil iam ch serviceAccount:$SA_EMAIL:legacyBucketWriter gs://artifacts.$PROJECT_ID.appspot.com 2>/dev/null || true

echo ""
echo "✅ Container Registry initialized"
echo ""

# Show final permissions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ COMPLETE! Current Permissions:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SA_EMAIL" \
  --format="table(bindings.role)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 READY TO DEPLOY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Go to: https://github.com/Sharvanandchaudary/RRCLOUD/actions"
echo "Click: 'Re-run failed jobs'"
echo ""
echo "Or run locally: git commit --allow-empty -m 'Deploy' && git push"
echo ""
