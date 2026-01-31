-- Add test users for dropdown testing
-- Password for all users: password123

-- Insert test students (if they don't exist)
INSERT INTO users (email, password_hash, full_name, role, phone, status) 
VALUES 
  ('student1@test.com', '$2a$10$xQK5YxW8p6YxW8p6YxW8p.aBcDeFgHiJkLmNoPqRsTuVwXyZ123', 'Test Student 1', 'student', '1234567890', 'active'),
  ('student2@test.com', '$2a$10$xQK5YxW8p6YxW8p6YxW8p.aBcDeFgHiJkLmNoPqRsTuVwXyZ123', 'Test Student 2', 'student', '1234567891', 'active'),
  ('student3@test.com', '$2a$10$xQK5YxW8p6YxW8p6YxW8p.aBcDeFgHiJkLmNoPqRsTuVwXyZ123', 'Test Student 3', 'student', '1234567892', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert test trainers
INSERT INTO users (email, password_hash, full_name, role, phone, status)
VALUES
  ('trainer1@test.com', '$2a$10$xQK5YxW8p6YxW8p6YxW8p.aBcDeFgHiJkLmNoPqRsTuVwXyZ123', 'Test Trainer 1', 'trainer', '2234567890', 'active'),
  ('trainer2@test.com', '$2a$10$xQK5YxW8p6YxW8p6YxW8p.aBcDeFgHiJkLmNoPqRsTuVwXyZ123', 'Test Trainer 2', 'trainer', '2234567891', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert test recruiters
INSERT INTO users (email, password_hash, full_name, role, phone, status)
VALUES
  ('recruiter1@test.com', '$2a$10$xQK5YxW8p6YxW8p6YxW8p.aBcDeFgHiJkLmNoPqRsTuVwXyZ123', 'Test Recruiter 1', 'recruiter', '3234567890', 'active'),
  ('recruiter2@test.com', '$2a$10$xQK5YxW8p6YxW8p6YxW8p.aBcDeFgHiJkLmNoPqRsTuVwXyZ123', 'Test Recruiter 2', 'recruiter', '3234567891', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT role, COUNT(*) as count FROM users GROUP BY role;
