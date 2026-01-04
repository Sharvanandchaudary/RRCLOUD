#!/bin/bash
# Initialize Database Tables

echo "🔧 Initializing Database Tables..."
echo ""

# Create SQL script
cat > /tmp/init_tables.sql << 'EOF'
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    about_me TEXT NOT NULL,
    resume_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@rrcloud.com', '$2a$10$rF8cZ5qKvH9xYK5vXz.F5.K8FqYnJ8vH9xYK5vXz.F5.K8FqYnJ8v', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Show tables
\dt

-- Show counts
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Applications' as table_name, COUNT(*) as count FROM applications;
EOF

echo "✅ SQL script created at /tmp/init_tables.sql"
echo ""

# Connect and run
echo "🔌 Connecting to database..."
echo "   Instance: rrcloud-db"
echo "   Database: sharvanandchaudhary"
echo ""

gcloud sql connect rrcloud-db --user=postgres --database=sharvanandchaudhary < /tmp/init_tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Database tables initialized successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Tables created:"
    echo "   • users (with default admin)"
    echo "   • applications"
    echo ""
    echo "🔑 Default Admin Credentials:"
    echo "   Email: admin@zgenai.com"
    echo "   Password: admin123"
    echo ""
else
    echo ""
    echo "❌ Failed to initialize tables"
    echo ""
    echo "Manual connection command:"
    echo "gcloud sql connect rrcloud-db --user=postgres --database=sharvanandchaudhary"
    echo ""
fi
