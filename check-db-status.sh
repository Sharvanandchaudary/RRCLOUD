#!/bin/bash
# Check Cloud SQL Database Status

echo "🔍 Checking Cloud SQL Database Status..."
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
echo "📋 Project: $PROJECT_ID"
echo ""

# Check if instance exists
echo "1️⃣  Checking if 'rrcloud-db' instance exists..."
INSTANCE_STATUS=$(gcloud sql instances describe rrcloud-db --format="value(state)" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "   ✅ Instance exists!"
    echo "   Status: $INSTANCE_STATUS"
    echo ""
    
    # Get details
    echo "2️⃣  Instance Details:"
    CONNECTION_NAME=$(gcloud sql instances describe rrcloud-db --format="value(connectionName)")
    REGION=$(gcloud sql instances describe rrcloud-db --format="value(region)")
    VERSION=$(gcloud sql instances describe rrcloud-db --format="value(databaseVersion)")
    
    echo "   Connection Name: $CONNECTION_NAME"
    echo "   Region: $REGION"
    echo "   Version: $VERSION"
    echo ""
    
    # Check databases
    echo "3️⃣  Checking databases in instance..."
    DATABASES=$(gcloud sql databases list --instance=rrcloud-db --format="value(name)" 2>/dev/null)
    
    if [ -n "$DATABASES" ]; then
        echo "   Databases found:"
        echo "$DATABASES" | while read db; do
            echo "      • $db"
        done
        
        # Check if our database exists
        if echo "$DATABASES" | grep -q "sharvanandchaudhary"; then
            echo ""
            echo "   ✅ Database 'sharvanandchaudhary' exists!"
        else
            echo ""
            echo "   ⚠️  Database 'sharvanandchaudhary' NOT found"
            echo "   Run: gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db"
        fi
    fi
    echo ""
    
    # Show what's needed
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ DATABASE EXISTS - Here's your DATABASE_URL:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "postgres://postgres:YOUR_PASSWORD@/sharvanandchaudhary?host=/cloudsql/$CONNECTION_NAME"
    echo ""
    echo "⚠️  Replace YOUR_PASSWORD with your actual postgres password"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔑 Service Account Key (if you have it):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ -f "github-actions-key.json" ]; then
        echo "✅ Found: github-actions-key.json"
        echo ""
        cat github-actions-key.json
    else
        echo "⚠️  Not found. You already have it from previous run."
        echo "   Check your earlier output for the JSON key."
    fi
    echo ""
    
else
    echo "   ❌ Instance 'rrcloud-db' does NOT exist"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Create it with this command:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "gcloud sql instances create rrcloud-db \\"
    echo "  --database-version=POSTGRES_14 \\"
    echo "  --tier=db-f1-micro \\"
    echo "  --region=us-central1 \\"
    echo "  --root-password=YourSecurePassword123"
    echo ""
    echo "Then create the database:"
    echo "gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $? -eq 0 ]; then
    echo "✅ Cloud SQL Instance: READY"
    echo "✅ Next Step: Add GitHub Secrets and deploy"
else
    echo "❌ Cloud SQL Instance: NOT CREATED"
    echo "⏩ Next Step: Create instance using command above"
fi
echo ""
