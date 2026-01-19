# Student Dashboard System - Quick Start Guide

## 🎯 What Was Built

A complete student dashboard and management system that allows:
- Students to apply for programs
- Admins to review and approve students
- Approved students to create secure accounts
- Students to view and manage their profiles in a dedicated dashboard

---

## 🚀 Getting Started

### For Testing Locally

1. **Start Backend**
```bash
cd backend
npm install  # if not already done
npm start    # or node server.js
# Should run on http://localhost:5001
```

2. **Start Frontend**
```bash
cd frontend
npm install  # if not already done
npm start    # or npm start
# Should run on http://localhost:3000
```

3. **Initialize Database** (first time only)
```bash
cd ..
chmod +x init-database.sh
./init-database.sh
```

---

## 📋 Complete User Flow

### 1️⃣ Student Applies
```
Visit: http://localhost:3000/apply
Fill out: Name, Email, Phone, Resume, About Me
Click: SUBMIT
```

### 2️⃣ Admin Reviews Applications
```
Visit: http://localhost:3000/login
Enter:
  Email: admin@zgenai.com
  Password: admin123
Click: AUTHENTICATE
```

You'll see the **Student Applications Management** page with:
- ⏳ **Pending Applications** - Students waiting for approval
- ✅ **Approved Students** - Already approved students
- ❌ **Rejected Applications** - Rejected students

### 3️⃣ Admin Approves Student
```
Click: ✅ Approve & Setup (next to student name)
Modal opens with password form:
  Enter: Temporary Password (min 6 chars, 1 uppercase, 1 number)
  Click: ✅ Approve & Create Account
```

Student account is now created! ✨

### 4️⃣ Student Logs In (First Time)
```
Visit: http://localhost:3000/student-login
Enter:
  Email: (their email)
  Password: (temporary password admin set)
Click: LOGIN
```

### 5️⃣ Student Sets Up Account
```
Page: Account Setup
Shows: Your temporary password notice
Click: 🔑 Change Password
Enter:
  Current Password: (the temporary one)
  New Password: (must have 8+ chars, uppercase, lowercase, number, special char)
  Confirm Password: (same as new)
Click: ✅ Confirm & Continue
```

### 6️⃣ Student Uses Dashboard
```
Redirected to: Student Dashboard
Can:
  ✓ View profile information
  ✓ Edit name, phone, about me
  ✓ See application status (Approved/Pending)
  ✓ View resume and important dates
  ✓ See quick statistics
  ✓ Logout when done
```

---

## 📁 Key Files & Their Purpose

### Frontend Components
| File | Purpose |
|------|---------|
| `StudentSignup.js` | Student application form |
| `StudentLogin.js` | Student login page |
| `StudentDashboard.js` | 📊 Student dashboard & profile |
| `AdminStudentManagement.js` | 👨‍💼 Admin approval interface |
| `AccountSetup.js` | 🔐 First-time password setup |
| `App.js` | Main routing (updated with new routes) |

### Backend Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Student login |
| GET | `/auth/me` | Get authenticated user |
| POST | `/auth/change-password` | Change password (secure) |
| GET | `/api/applications` | List all applications |
| GET | `/api/applications/:email` | Get student's application |
| PUT | `/api/applications/:id` | Update student profile |
| POST | `/api/applications/:id/approve` | Approve student + create account |
| POST | `/api/applications/:id/reject` | Reject application |

### Database Schema
| Table | New Columns |
|-------|------------|
| `applications` | `is_approved`, `approved_date`, `approved_by`, `status` |
| `users` | (unchanged) |

---

## 🔐 Credentials

### Default Admin
```
Email: admin@zgenai.com
Password: admin123
```

### Example Student (after creation)
```
Email: (whatever they applied with)
Password: (temporary password set by admin during approval)
Changed to: (whatever they set in account setup)
```

---

## 🎨 UI Features

### StudentDashboard
- Welcome greeting with personalized name
- Application status badge (Approved/Pending)
- Editable profile sections
- Resume download link
- Important date tracking
- Quick statistics cards
- Clean gradient background

### AdminStudentManagement
- Organized by status (Pending, Approved, Rejected)
- Table view with sortable columns
- One-click approval with modal
- Password validation requirements display
- Responsive design

### AccountSetup
- Gradient background design
- Clear password requirements
- Real-time validation feedback
- Option to skip (not recommended)
- Security tips displayed

---

## ✅ Password Requirements

### Admin Setting Temporary Password
- ✓ Minimum 6 characters
- ✓ At least 1 uppercase letter
- ✓ At least 1 number

### Student Changing Password (First Login)
- ✓ Minimum 8 characters
- ✓ At least 1 uppercase letter (A-Z)
- ✓ At least 1 lowercase letter (a-z)
- ✓ At least 1 number (0-9)
- ✓ At least 1 special character (!@#$%^&*)

---

## 🧪 Testing Scenarios

### ✅ Happy Path
1. Student applies → Admin approves → Student logs in → Changes password → Accesses dashboard ✨

### 🚫 Error Cases
- Invalid login credentials → "Invalid credentials" error
- Password doesn't match confirmation → "Passwords do not match"
- Old password incorrect when changing → "Current password is incorrect"
- Student tries to access without token → Redirected to login
- Admin tries to approve with weak password → Shows validation errors

---

## 🔧 Configuration

### Environment Variables Needed
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sharvanandchaudhary
DB_USER=postgres
DB_PASSWORD=<your-postgres-password>
JWT_SECRET=dev_jwt_secret
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### CORS Setup
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5001`
- setupProxy.js redirects `/api`, `/auth`, `/applications` to backend

---

## 📊 Database Initialization

The `init-database.sh` script creates:
1. ✅ `users` table - For admin and student accounts
2. ✅ `applications` table - For student applications

The script can be run multiple times safely (uses `IF NOT EXISTS`)

---

## 🎯 Next Steps

After testing locally:
1. Push changes to GitHub
2. GitHub Actions will auto-deploy to GCP
3. Update the `FRONTEND_URL` in secrets
4. Test on production domain

---

## ❓ FAQ

**Q: Can a student apply twice?**
A: No, email is unique in the applications table.

**Q: What if admin forgets to approve a student?**
A: Student will see "Pending Review" status in dashboard, but can't login yet.

**Q: Can students change their password anytime?**
A: Currently only at account setup. You can add a "Change Password" in settings later.

**Q: What happens if a student is rejected?**
A: Their application status changes to "rejected", they can see it in the admin panel.

**Q: Can multiple admins approve students?**
A: Yes! The `approved_by` field tracks who approved. Currently hardcoded as "admin@rrcloud.com"

**Q: How long is the JWT token valid?**
A: 7 days. After that, student needs to login again.

---

## 📞 Support

For issues or questions:
1. Check the error message in console (browser DevTools)
2. Check backend logs in terminal
3. Verify all environment variables are set
4. Ensure PostgreSQL is running and database is initialized

---

## 🚀 Deployment Checklist

- [ ] Environment variables set in GitHub Secrets
- [ ] Database initialized on GCP Cloud SQL
- [ ] Backend Docker image built
- [ ] Frontend Docker image built
- [ ] Cloud Run services deployed
- [ ] CORS configured for production domain
- [ ] SSL certificate configured
- [ ] Email service configured (optional, for notifications)
- [ ] Backup system in place

---

**Built with ❤️ for the ZgenAi Platform**
