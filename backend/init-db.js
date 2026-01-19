#!/usr/bin/env node
// Initialize database tables using Node.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sharvanandchaudhary'
});

const initSQL = `
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
VALUES ('admin@zgenai.com', 'admin123', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
`;

async function init() {
  try {
    console.log('🗄️  Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('📝 Creating tables...');
    await client.query(initSQL);
    console.log('✅ Tables created');

    console.log('👤 Verifying admin user...');
    const result = await client.query('SELECT * FROM users WHERE email = $1', ['admin@zgenai.com']);
    if (result.rows.length > 0) {
      console.log('✅ Admin user exists:', result.rows[0].email);
    }

    console.log('\n✅ Database initialization complete!');
    console.log('📧 Admin Email: admin@zgenai.com');
    console.log('🔑 Admin Password: admin123');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

init();
