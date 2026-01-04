#!/bin/bash
# Fetch All GCP Details for GitHub Secrets
# Run this in GCP Cloud Shell

echo "🔍 Fetching GCP Configuration Details..."
echo ""

# 1. Get Project ID
echo "1️⃣  GCP_PROJECT_ID:"
PROJECT_ID=$(gcloud config get-value project)
echo "   $PROJECT_ID"
echo ""

# 2. Check Cloud SQL
echo "2️⃣  Checking Cloud SQL Database..."
SQL_EXISTS=$(gcloud sql instances list --filter="name:rrcloud-db" --format="value(name)" 2>/dev/null)

if [ -n "$SQL_EXISTS" ]; then
    echo "   ✅ Cloud SQL instance 'rrcloud-db' exists"
    CONNECTION_NAME=$(gcloud sql instances describe rrcloud-db --format="value(connectionName)")
    echo "   Connection: $CONNECTION_NAME"
    echo ""
    echo "   📋 DATABASE_URL:"
    echo "   postgres://postgres:YOUR_PASSWORD@/sharvanandchaudhary?host=/cloudsql/$CONNECTION_NAME"
    echo "   ⚠️  Replace YOUR_PASSWORD with your actual password"
    echo ""
else
    echo "   ❌ Cloud SQL instance not found. Creating it..."
    echo "   (This takes 5-10 minutes)"
    echo ""
    
    read -sp "Enter a secure password for PostgreSQL: " DB_PASSWORD
    echo ""
    
    gcloud sql instances create rrcloud-db \
      --database-version=POSTGRES_14 \
      --tier=db-f1-micro \
      --region=us-central1 \
      --root-password=$DB_PASSWORD \
      --no-backup
    
    gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db
    
    CONNECTION_NAME=$(gcloud sql instances describe rrcloud-db --format="value(connectionName)")
    
    echo ""
    echo "   📋 DATABASE_URL:"
    echo "   postgres://postgres:$DB_PASSWORD@/sharvanandchaudhary?host=/cloudsql/$CONNECTION_NAME"
    echo ""
fi

# 3. Check Service Account
echo "3️⃣  Checking Service Account..."
SA_EXISTS=$(gcloud iam.service-accounts list --filter="email:github-actions@$PROJECT_ID.iam.gserviceaccount.com" --format="value(email)" 2>/dev/null)

if [ -n "$SA_EXISTS" ]; then
    echo "   ✅ Service account exists"
    
    if [ -f "github-actions-key.json" ]; then
        echo "   ✅ Key file found: github-actions-key.json"
    else
        echo "   Creating new key..."
        gcloud iam service-accounts keys create github-actions-key.json \
          --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
        echo "   ✅ Key created: github-actions-key.json"
    fi
else
    echo "   ❌ Service account not found. Creating..."
    
    gcloud iam service-accounts create github-actions --display-name="GitHub Actions"
    
    # Grant permissions
    echo "   Adding permissions..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
      --role="roles/run.admin" --quiet
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
      --role="roles/storage.admin" --quiet
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
      --role="roles/iam.serviceAccountUser" --quiet
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
      --role="roles/cloudsql.client" --quiet
    
    # Create key
    gcloud iam service-accounts keys create github-actions-key.json \
      --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
    
    echo "   ✅ Service account created with key"
fi

echo ""
echo "   📋 GCP_SA_KEY (copy entire JSON):"
cat github-actions-key.json
echo ""

# 4. Frontend URL
echo "4️⃣  FRONTEND_URL:"
FRONTEND_URL=$(gcloud run services list --filter="metadata.name:rrcloud-frontend" --format="value(status.url)" 2>/dev/null)

if [ -n "$FRONTEND_URL" ]; then
    echo "   $FRONTEND_URL"
else
    echo "   Not deployed yet. Use: https://placeholder.com"
    echo "   Update this secret after first deployment"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           📋 GitHub Secrets Summary                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Copy these values to GitHub Secrets:"
echo "https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions"
echo ""

echo "Secret Name: GCP_PROJECT_ID"
echo "Value: $PROJECT_ID"
echo ""

echo "Secret Name: GCP_SA_KEY"
echo "Value: (entire JSON content from github-actions-key.json above)"
echo ""

echo "Secret Name: DATABASE_URL"
echo "Value: (connection string shown in step 2 above)"
echo ""

echo "Secret Name: FRONTEND_URL"
echo "Value: https://placeholder.com (update after first deploy)"
echo ""

echo "⚠️  To download the key file from Cloud Shell:"
echo "   Click on the 3-dot menu → Download → github-actions-key.json"
echo ""
echo "🚀 After adding secrets, push to GitHub to trigger deployment!"
