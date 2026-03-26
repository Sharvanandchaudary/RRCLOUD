#!/bin/bash

echo "🔐 Creating Demo Accounts for Testing"
echo "======================================"
echo ""

# Get database connection details from environment or use defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-rrcloud_db}"
DB_USER="${DB_USER:-postgres}"

echo "📊 Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo ""

# Check if we're running on Cloud SQL
if [ -f "/workspace/cloudbuild.yaml" ] || [ -n "$GOOGLE_CLOUD_PROJECT" ]; then
  echo "☁️  Detected GCP environment - using Cloud SQL connection"
  # For GCP, we'll use the connection via Cloud SQL Proxy
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f create-demo-accounts.sql
else
  echo "💻 Running locally - attempting connection to $DB_HOST"
  
  # Check if PostgreSQL is accessible
  if command -v psql &> /dev/null; then
    echo "✅ psql command found"
    
    # Try to connect and execute SQL
    if [ -n "$DB_PASSWORD" ]; then
      PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f create-demo-accounts.sql
    else
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f create-demo-accounts.sql
    fi
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "✅ Demo accounts created successfully!"
      echo ""
      echo "📧 Test Accounts Created:"
      echo "   Student:   student@demo.com   | Password: demo123"
      echo "   Recruiter: recruiter@demo.com | Password: demo123"
      echo "   Trainer:   trainer@demo.com   | Password: demo123"
      echo ""
      echo "🌐 Access URLs:"
      echo "   Student Dashboard: /dashboard"
      echo "   Recruiter Dashboard: /recruiter-dashboard"
      echo "   Trainer Dashboard: /trainer-dashboard"
      echo ""
    else
      echo "❌ Failed to create demo accounts"
      echo "   Make sure PostgreSQL is running and accessible"
    fi
  else
    echo "⚠️  psql command not found"
    echo "   Please install PostgreSQL client or run the SQL manually"
    echo "   SQL file: create-demo-accounts.sql"
  fi
fi
