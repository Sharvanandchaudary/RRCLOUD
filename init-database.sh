#!/bin/bash
# Initialize RRCloud Database with Tables
# Run this AFTER creating Cloud SQL instance

echo "🗄️  Initializing ZgenAi Database..."
echo ""

# Get project info
PROJECT_ID=$(gcloud config get-value project)
INSTANCE_NAME="rrcloud-db"
DB_NAME="sharvanandchaudhary"

echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Instance: $INSTANCE_NAME"
echo "   Database: $DB_NAME"
echo ""

# Check if instance exists
echo "1️⃣  Checking Cloud SQL instance..."
INSTANCE_EXISTS=$(gcloud sql instances describe $INSTANCE_NAME --format="value(name)" 2>/dev/null)

if [ -z "$INSTANCE_EXISTS" ]; then
    echo "   ❌ Cloud SQL instance '$INSTANCE_NAME' not found!"
    echo "   Please create it first with:"
    echo "   gcloud sql instances create rrcloud-db --database-version=POSTGRES_14 --tier=db-f1-micro --region=us-central1 --root-password=YOUR_PASSWORD"
    exit 1
fi

echo "   ✅ Instance found"
echo ""

# Create database if doesn't exist
echo "2️⃣  Creating database (if not exists)..."
gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME 2>/dev/null || echo "   ✅ Database already exists"
echo ""

# Create initialization SQL
echo "3️⃣  Creating tables..."
cat > init_db.sql << 'EOF'
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
  is_approved BOOLEAN DEFAULT FALSE,
  approved_date TIMESTAMP,
  approved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin User
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@rrcloud.com', 'RRCloud2024Secure!', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'applications' as table_name, COUNT(*) as count FROM applications;
EOF

echo "   ✅ SQL script created: init_db.sql"
echo ""

# Execute SQL
echo "4️⃣  Executing SQL on Cloud SQL..."
echo "   (You'll be prompted for the postgres password)"
echo ""

gcloud sql connect $INSTANCE_NAME --user=postgres --database=$DB_NAME < init_db.sql

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Database Initialized!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Tables Created:"
echo "   ✅ users - For admin login"
echo "   ✅ applications - For student signups"
echo ""
echo "Default Admin User:"
echo "   📧 Email: admin@rrcloud.com"
echo "   🔑 Password: RRCloud2024Secure!"
echo ""
echo "🚀 Database is ready for deployment!"
echo "   Your app will now store data in PostgreSQL"
