const { Pool } = require('pg');

// Production Connection
const connectionString = 'postgres://rrcloud_admin:secure_pass_123@localhost:5432/rrcloud_prod';

const pool = new Pool({
  connectionString,
});

pool.on('connect', () => {
  console.log('✅ Connected to Production Database (rrcloud_prod)');
});

pool.on('error', (err) => {
  console.error('❌ Database Error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
