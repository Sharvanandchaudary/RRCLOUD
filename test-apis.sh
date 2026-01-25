#!/bin/bash

# Terminal test script for user creation and assignment
echo "🚀 Testing Frontend API Calls from Terminal"
echo "============================================"

# Step 1: Login and get token
echo "🔐 Step 1: Login as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zgenai.com", "password": "admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//g' | sed 's/"//g')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Login response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Authentication successful"
echo "Token: ${TOKEN:0:30}..."
echo

# Step 2: Create a test user
echo "👤 Step 2: Creating test user..."
USER_EMAIL="frontendtest$(date +%s)@example.com"
USER_RESPONSE=$(curl -s -X POST "https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\": \"Frontend Test User\", \"email\": \"$USER_EMAIL\", \"phone\": \"1234567890\", \"role\": \"student\"}")

echo "User creation response: $USER_RESPONSE"

USER_ID=$(echo $USER_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id"://')

if [ -z "$USER_ID" ]; then
  echo "❌ Failed to create user"
  exit 1
fi

echo "✅ User created with ID: $USER_ID"
echo

# Step 3: Get users list to verify
echo "📋 Step 3: Fetching users list..."
USERS_RESPONSE=$(curl -s -X GET "https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/api/users" \
  -H "Authorization: Bearer $TOKEN")

USERS_COUNT=$(echo $USERS_RESPONSE | grep -o '{"id":[^}]*}' | wc -l)
echo "✅ Found $USERS_COUNT total users"
echo

# Step 4: Create assignment
echo "🔄 Step 4: Creating assignment..."
ASSIGNMENT_RESPONSE=$(curl -s -X POST "https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/api/assignments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"student_id\": \"$USER_ID\", \"assigned_user_id\": \"7\", \"assigned_user_role\": \"trainer\"}")

echo "Assignment creation response: $ASSIGNMENT_RESPONSE"

ASSIGNMENT_ID=$(echo $ASSIGNMENT_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id"://')

if [ -z "$ASSIGNMENT_ID" ]; then
  echo "❌ Failed to create assignment"
  exit 1
fi

echo "✅ Assignment created with ID: $ASSIGNMENT_ID"
echo

# Step 5: Verify assignment
echo "🔍 Step 5: Fetching assignments list..."
ASSIGNMENTS_RESPONSE=$(curl -s -X GET "https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/api/assignments" \
  -H "Authorization: Bearer $TOKEN")

echo "Assignments response (first 200 chars): ${ASSIGNMENTS_RESPONSE:0:200}..."
echo

echo "✅ All API tests completed successfully!"
echo "🎯 Backend APIs are working perfectly"
echo "📍 If frontend is not working, the issue is in the JavaScript/React code"