-- Add demo/test accounts for Student and Recruiter

-- Demo Student Account
-- Email: student@demo.com
-- Password: demo123
INSERT INTO users (email, password_hash, full_name, phone, role, status)
VALUES (
  'student@demo.com',
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', -- bcrypt hash of 'demo123'
  'Student Demo',
  '+1-555-0101',
  'student',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Demo Recruiter Account
-- Email: recruiter@demo.com
-- Password: demo123
INSERT INTO users (email, password_hash, full_name, phone, role, status)
VALUES (
  'recruiter@demo.com',
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', -- bcrypt hash of 'demo123'
  'Recruiter Demo',
  '+1-555-0102',
  'recruiter',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Demo Trainer Account
-- Email: trainer@demo.com
-- Password: demo123
INSERT INTO users (email, password_hash, full_name, phone, role, status)
VALUES (
  'trainer@demo.com',
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', -- bcrypt hash of 'demo123'
  'Trainer Demo',
  '+1-555-0103',
  'trainer',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Student application (already approved)
INSERT INTO applications (
  full_name, email, phone, education, skills, experience, 
  interested_courses, linkedin_url, github_url, 
  resume_file, cover_letter, status, is_approved
)
VALUES (
  'Student Demo',
  'student@demo.com',
  '+1-555-0101',
  'Bachelor of Science in Computer Science',
  'JavaScript, React, Node.js, Python, SQL, Git',
  '1 year internship experience',
  'Full Stack Development, Cloud Computing',
  'https://linkedin.com/in/student-demo',
  'https://github.com/student-demo',
  'student-demo-resume.pdf',
  'Eager to learn and grow in software development',
  'approved',
  true
)
ON CONFLICT (email) DO UPDATE SET
  status = EXCLUDED.status,
  is_approved = EXCLUDED.is_approved;

-- Create assignments (Student assigned to Trainer and Recruiter)
INSERT INTO assignments (student_id, assigned_user_id, assigned_user_role, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'student@demo.com'),
  (SELECT id FROM users WHERE email = 'trainer@demo.com'),
  'trainer',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM assignments 
  WHERE student_id = (SELECT id FROM users WHERE email = 'student@demo.com')
  AND assigned_user_id = (SELECT id FROM users WHERE email = 'trainer@demo.com')
);

INSERT INTO assignments (student_id, assigned_user_id, assigned_user_role, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'student@demo.com'),
  (SELECT id FROM users WHERE email = 'recruiter@demo.com'),
  'recruiter',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM assignments 
  WHERE student_id = (SELECT id FROM users WHERE email = 'student@demo.com')
  AND assigned_user_id = (SELECT id FROM users WHERE email = 'recruiter@demo.com')
);

-- Display created accounts
SELECT 
  email, 
  full_name, 
  role, 
  status,
  'demo123' as password
FROM users 
WHERE email IN ('student@demo.com', 'recruiter@demo.com', 'trainer@demo.com')
ORDER BY role;

COMMIT;

-- Summary
SELECT 
  '✅ Demo accounts created successfully!' as message,
  'Email: student@demo.com, recruiter@demo.com, trainer@demo.com' as accounts,
  'Password: demo123' as credentials;
