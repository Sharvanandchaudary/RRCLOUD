-- Update Admin Credentials
-- This script updates the admin user password in the database

-- First, check if admin exists
SELECT 'Checking for admin user...' as status;
SELECT email, role FROM users WHERE email = 'admin@rrcloud.com';

-- Update admin password (plaintext for testing - in production use bcrypt)
UPDATE users 
SET password_hash = 'RRCloud2024Secure!'
WHERE email = 'admin@rrcloud.com' AND role = 'admin';

-- If admin doesn't exist, insert new one
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@rrcloud.com', 'RRCloud2024Secure!', 'System Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET password_hash = 'RRCloud2024Secure!';

-- Verify
SELECT 'Admin credentials updated!' as status;
SELECT email, password_hash, role FROM users WHERE email = 'admin@rrcloud.com';
