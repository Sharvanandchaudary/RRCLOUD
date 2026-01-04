const { Pool } = require('pg');

// Connect explicitly to your new user and database
const connectionString = 'postgres://sharvanandchaudhary:admin@localhost:5432/sharvanandchaudhary';
const pool = new Pool({ connectionString });

async function debug() {
  try {
    console.log("🔍 Attempting to connect to DB...");

    // 1. Check if table exists
    const tableCheck = await pool.query("SELECT to_regclass('public.users');");
    if (!tableCheck.rows[0].to_regclass) {
        console.log("❌ ERROR: The table 'users' does not exist!");
        return;
    }

    // 2. Check if admin user exists
    console.log("✅ Table exists. Checking for Admin user...");
    const res = await pool.query("SELECT * FROM users WHERE email = 'admin@zgenai.com'");

    if (res.rows.length === 0) {
        console.log("❌ ERROR: User 'admin@zgenai.com' was NOT found.");
        console.log("   (You need to run setup_db.js again)");
    } else {
        console.log("✅ SUCCESS: Found Admin User!");
        console.log("   ID:", res.rows[0].id);
        console.log("   Email:", res.rows[0].email);
        console.log("   Password Hash:", res.rows[0].password_hash);
    }
  } catch (err) {
    console.error("❌ CRITICAL DB ERROR:", err.message);
  } finally {
    pool.end();
  }
}

debug();

