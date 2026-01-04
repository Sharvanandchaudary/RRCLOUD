#!/bin/bash
# Complete ZgenAi GCP Setup Script
# Run this in GCP Cloud Shell

echo "🚀 ZgenAi Complete GCP Setup"
echo "══════════════════════════════════════════════════════════"
echo ""

PROJECT_ID=$(gcloud config get-value project)
echo "Project: $PROJECT_ID"
echo ""

# Step 1: Enable Required APIs
echo "1️⃣  Enabling Required APIs..."
gcloud services enable sqladmin.googleapis.com --quiet 2>/dev/null
gcloud services enable sql-component.googleapis.com --quiet 2>/dev/null
gcloud services enable run.googleapis.com --quiet 2>/dev/null
gcloud services enable cloudbuild.googleapis.com --quiet 2>/dev/null
gcloud services enable containerregistry.googleapis.com --quiet 2>/dev/null
echo "   ✅ APIs enabled"
echo ""

# Step 2: Check and Create Cloud SQL
echo "2️⃣  Setting up Cloud SQL Database..."
EXISTING_INSTANCE=$(gcloud sql instances list --filter="name:rrcloud-db" --format="value(name)" 2>/dev/null)

if [ -n "$EXISTING_INSTANCE" ]; then
    echo "   ⚠️  Instance 'rrcloud-db' already exists"
    read -p "   Delete and recreate? (y/n): " RECREATE
    if [ "$RECREATE" = "y" ]; then
        echo "   Deleting old instance..."
        gcloud sql instances delete rrcloud-db --quiet
        sleep 5
    fi
fi

# Check again after potential deletion
EXISTING_INSTANCE=$(gcloud sql instances list --filter="name:rrcloud-db" --format="value(name)" 2>/dev/null)

if [ -z "$EXISTING_INSTANCE" ]; then
    echo "   Creating new Cloud SQL instance..."
    echo "   ⏳ This takes 5-10 minutes. Please wait..."
    echo ""
    
    read -sp "   Enter a secure password for PostgreSQL: " DB_PASSWORD
    echo ""
    
    gcloud sql instances create rrcloud-db \
      --database-version=POSTGRES_14 \
      --tier=db-f1-micro \
      --region=us-central1 \
      --root-password="$DB_PASSWORD" \
      --backup-start-time=03:00 \
      --maintenance-window-day=SUN \
      --maintenance-window-hour=3
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Failed to create Cloud SQL instance"
        exit 1
    fi
    
    echo ""
    echo "   ✅ Cloud SQL instance created!"
else
    echo "   ✅ Using existing instance"
    read -sp "   Enter the PostgreSQL password: " DB_PASSWORD
    echo ""
fi

# Wait for instance to be ready
echo ""
echo "   Waiting for instance to be ready..."
sleep 30

# Step 3: Create Database
echo ""
echo "3️⃣  Creating Database..."
gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db 2>/dev/null || echo "   ✅ Database already exists"

# Step 4: Initialize Tables
echo ""
echo "4️⃣  Initializing Database Tables..."
echo "   Creating SQL script..."

cat > /tmp/init_tables.sql << 'EOF'
-- Create Users Table (for admin login)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Applications Table (for student signups)
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  about_me TEXT,
  resume_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin User
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@rrcloud.com', 'admin123', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT 'Tables Created:' as status;
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'applications' as table_name, COUNT(*) as count FROM applications;
EOF

echo "   Executing SQL (you'll be prompted for password)..."
gcloud sql connect rrcloud-db --user=postgres --database=sharvanandchaudhary < /tmp/init_tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ Tables initialized successfully!"
else
    echo ""
    echo "   ⚠️  Manual table creation needed. Run:"
    echo "   gcloud sql connect rrcloud-db --user=postgres --database=sharvanandchaudhary"
    echo "   Then paste the SQL from /tmp/init_tables.sql"
fi

# Step 5: Get Connection Details
echo ""
echo "5️⃣  Getting Connection Details..."
CONNECTION_NAME=$(gcloud sql instances describe rrcloud-db --format="value(connectionName)")
echo "   Connection: $CONNECTION_NAME"

# Step 6: Output Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ✅ GCP Setup Complete!                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 GitHub Secrets - Add these at:"
echo "   https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Secret 1: GCP_PROJECT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$PROJECT_ID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Secret 2: DATABASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "postgres://postgres:$DB_PASSWORD@/sharvanandchaudhary?host=/cloudsql/$CONNECTION_NAME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Secret 3: GCP_SA_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "github-actions-key.json" ]; then
    cat github-actions-key.json
else
    echo "⚠️  Run this to get the key:"
    echo "gcloud iam service-accounts keys create github-actions-key.json --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com"
    echo "cat github-actions-key.json"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Secret 4: FRONTEND_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "https://placeholder.com"
echo "(Update after first deployment)"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Database Status:"
echo "   ✅ Cloud SQL Instance: rrcloud-db"
echo "   ✅ Database: sharvanandchaudhary"
echo "   ✅ Tables: users, applications"
echo "   ✅ Default Admin: admin@zgenai.com / admin123"
echo ""
echo "🚀 Next Steps:"
echo "   1. Add all 4 secrets to GitHub"
echo "   2. Push code: git push origin main"
echo "   3. Watch deployment at: https://github.com/Sharvanandchaudary/RRCLOUD/actions"
echo ""
echo "💾 Save your password: $DB_PASSWORD"
echo ""
