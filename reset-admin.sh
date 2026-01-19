#!/bin/bash
# Reset Admin Credentials to Known Value

echo "🔐 Resetting Admin Credentials..."
echo ""

PROJECT_ID=$(gcloud config get-value project)
INSTANCE_NAME="rrcloud-db"
DB_NAME="sharvanandchaudhary"

echo "Configuration:"
echo "   Instance: $INSTANCE_NAME"
echo "   Database: $DB_NAME"
echo ""

# Use gcloud sql query to reset admin
echo "Updating admin credentials in database..."

# Create a temporary SQL file
cat > /tmp/reset_admin.sql << 'EOF'
DELETE FROM users WHERE email = 'admin@zgenai.com';
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@zgenai.com', 'admin123', 'System Admin', 'admin');
SELECT * FROM users WHERE email = 'admin@zgenai.com';
EOF

# Execute using Cloud SQL Proxy or direct connection
gcloud sql connect $INSTANCE_NAME --user=postgres --database=$DB_NAME < /tmp/reset_admin.sql 2>/dev/null || \
  echo "Note: If psql not available, try: gcloud sql import sql $INSTANCE_NAME /tmp/reset_admin.sql --database=$DB_NAME"

echo ""
echo "✅ Admin credentials should be reset!"
echo "   📧 Email: admin@zgenai.com"
echo "   🔑 Password: admin123"
