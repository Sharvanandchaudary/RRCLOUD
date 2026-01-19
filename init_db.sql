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

-- Verify
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'applications' as table_name, COUNT(*) as count FROM applications;
