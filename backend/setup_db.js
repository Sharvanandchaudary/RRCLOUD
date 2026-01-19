const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setup() {
  try {
    console.log("🔌 Connecting to Database...");
    console.log("📍 Database URL:", process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    
    // 1. Create Users Table (for admin login)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'users' created/verified");

    // 2. Create Applications Table (for student signups)
    await pool.query(`
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
    `);
    console.log("✅ Table 'applications' created/verified");

    // 3. Insert Admin User
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('admin@zgenai.com', 'admin123', 'System Admin', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log("✅ Admin user created: admin@zgenai.com / admin123");

    // 4. Verify tables
    const usersRes = await pool.query("SELECT COUNT(*) FROM users");
    const appsRes = await pool.query("SELECT COUNT(*) FROM applications");
    
    console.log("\n📊 Database Status:");
    console.log(`   Users: ${usersRes.rows[0].count}`);
    console.log(`   Applications: ${appsRes.rows[0].count}`);
    console.log("\n✅ Database setup complete!");

  } catch (err) {
    console.error("\n❌ Database Error:", err.message);
    
    if (err.message.includes('password authentication failed')) {
      console.log("\n💡 Fix: Reset PostgreSQL password or update DATABASE_URL in .env");
      console.log("   Windows: Run as Administrator:");
      console.log("   psql -U postgres -c \"ALTER USER sharvanandchaudhary WITH PASSWORD 'admin';\"");
    } else if (err.message.includes('does not exist')) {
      console.log("\n💡 Fix: Create the database first:");
      console.log("   psql -U postgres -c \"CREATE DATABASE sharvanandchaudhary;\"");
    } else if (err.message.includes('connection refused')) {
      console.log("\n💡 Fix: Start PostgreSQL service:");
      console.log("   Windows: net start postgresql-x64-14");
    }
    
  } finally {
    await pool.end();
  }
}

setup();
