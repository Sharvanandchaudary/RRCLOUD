-- Delete existing admin if present
DELETE FROM users WHERE email = 'admin@zgenai.com';

-- Insert new admin with plaintext password (backend will handle fallback comparison)
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@zgenai.com', 'admin123', 'System Admin', 'admin');

-- Verify
SELECT * FROM users WHERE email = 'admin@zgenai.com';
