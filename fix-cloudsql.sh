#!/bin/bash
# Fix Cloud SQL Instance Creation Issues

echo "🔧 Fixing Cloud SQL Instance Setup..."
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
echo "📋 Project: $PROJECT_ID"
echo ""

# Step 1: Enable required APIs
echo "1️⃣  Enabling required APIs..."
echo "   (This takes 2-3 minutes)"

gcloud services enable sqladmin.googleapis.com --quiet
gcloud services enable compute.googleapis.com --quiet
gcloud services enable servicenetworking.googleapis.com --quiet

echo "   ✅ APIs enabled"
echo ""

# Step 2: Check for existing instances (including failed ones)
echo "2️⃣  Checking for existing/failed instances..."
EXISTING=$(gcloud sql instances list --filter="name:rrcloud-db" --format="value(name)" 2>/dev/null)

if [ -n "$EXISTING" ]; then
    echo "   ⚠️  Found existing instance: $EXISTING"
    echo ""
    read -p "   Delete it and recreate? (y/n): " CONFIRM
    
    if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
        echo "   Deleting old instance..."
        gcloud sql instances delete rrcloud-db --quiet
        echo "   ✅ Deleted"
        echo "   Waiting 30 seconds for cleanup..."
        sleep 30
    else
        echo "   ❌ Aborted. Cannot proceed with existing instance."
        exit 1
    fi
else
    echo "   ✅ No existing instance found"
fi
echo ""

# Step 3: Wait for APIs to propagate
echo "3️⃣  Waiting for APIs to activate..."
echo "   (30 seconds)"
sleep 30
echo "   ✅ Ready"
echo ""

# Step 4: Create instance
echo "4️⃣  Creating Cloud SQL instance..."
echo "   Name: rrcloud-db"
echo "   Region: us-central1"
echo "   Version: PostgreSQL 14"
echo "   Tier: db-f1-micro (free tier)"
echo ""

gcloud sql instances create rrcloud-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=Admin@123456 \
  --no-backup

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ Instance created successfully!"
    echo ""
    
    # Wait for instance to be ready
    echo "5️⃣  Waiting for instance to be RUNNABLE..."
    for i in {1..30}; do
        STATUS=$(gcloud sql instances describe rrcloud-db --format="value(state)" 2>/dev/null)
        if [ "$STATUS" = "RUNNABLE" ]; then
            echo "   ✅ Instance is RUNNABLE"
            break
        fi
        echo "   ⏳ Status: $STATUS (attempt $i/30)"
        sleep 10
    done
    echo ""
    
    # Create database
    echo "6️⃣  Creating database 'sharvanandchaudhary'..."
    gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Database created!"
        echo ""
        
        # Show connection details
        CONNECTION_NAME=$(gcloud sql instances describe rrcloud-db --format="value(connectionName)")
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ SUCCESS! Here's your DATABASE_URL:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "postgres://postgres:Admin@123456@/sharvanandchaudhary?host=/cloudsql/$CONNECTION_NAME"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    else
        echo "   ❌ Database creation failed"
        exit 1
    fi
else
    echo ""
    echo "   ❌ Instance creation failed"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 Troubleshooting:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Check if billing is enabled:"
    echo "   https://console.cloud.google.com/billing/projects"
    echo ""
    echo "2. Check project quotas:"
    echo "   https://console.cloud.google.com/iam-admin/quotas"
    echo ""
    echo "3. Try a different region:"
    echo "   gcloud sql instances create rrcloud-db \\"
    echo "     --database-version=POSTGRES_14 \\"
    echo "     --tier=db-f1-micro \\"
    echo "     --region=us-east1 \\"
    echo "     --root-password=Admin@123456"
    echo ""
    exit 1
fi

echo "🎉 All done! Now run ./check-db-status.sh to verify"
echo ""
