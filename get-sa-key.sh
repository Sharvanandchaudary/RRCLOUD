#!/bin/bash
# Get Service Account Key for GitHub Secret

echo "🔑 Fetching Service Account Key..."
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

# Check if key file exists
if [ -f "github-actions-key.json" ]; then
    echo "✅ Found existing key file!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 GCP_SA_KEY (Copy this entire JSON):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    cat github-actions-key.json
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "⚠️  Key file not found. Creating new one..."
    echo ""
    
    # Check if service account exists
    SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"
    SA_EXISTS=$(gcloud iam service-accounts list --filter="email:$SA_EMAIL" --format="value(email)")
    
    if [ -n "$SA_EXISTS" ]; then
        echo "✅ Service account exists: $SA_EMAIL"
        echo "   Creating new key..."
        
        gcloud iam service-accounts keys create github-actions-key.json \
          --iam-account=$SA_EMAIL
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 GCP_SA_KEY (Copy this entire JSON):"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        cat github-actions-key.json
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo "❌ Service account doesn't exist!"
        echo "   Run the get-gcp-details.sh script first"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ALL 4 GITHUB SECRETS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. GCP_PROJECT_ID"
echo "   $PROJECT_ID"
echo ""
echo "2. GCP_SA_KEY"
echo "   (The JSON shown above)"
echo ""
echo "3. DATABASE_URL"
echo "   postgres://postgres:Admin@123456@/sharvanandchaudhary?host=/cloudsql/rrcloud-platform:us-central1:rrcloud-db"
echo ""
echo "4. FRONTEND_URL"
echo "   https://placeholder.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Add these secrets at:"
echo "   https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions"
echo ""
