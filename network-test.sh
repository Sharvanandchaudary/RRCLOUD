#!/bin/bash
echo "🔍 RRCloud Network Diagnostics"
echo "============================="
echo

# Test backend health
echo "1. Testing Backend Health..."
curl -s https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/health | jq . || echo "❌ Backend health check failed"
echo

# Test applications API with proper headers
echo "2. Testing Applications API..."
curl -s -H "Accept: application/json" -H "Content-Type: application/json" https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/api/applications | head -200
echo

# Test frontend
echo "3. Testing Frontend..."
curl -I https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app 2>/dev/null | head -5
echo

# Test CORS
echo "4. Testing CORS..."
curl -s -H "Origin: https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/api/applications
echo

# Test with Accept-Encoding to avoid compression issues
echo "5. Testing without compression..."
curl -s -H "Accept-Encoding: identity" -H "Accept: application/json" https://rrcloud-backend-nsmgws4u4a-uc.a.run.app/api/applications | jq '.[0] | keys' 2>/dev/null || echo "❌ API returned non-JSON data"
echo

echo "✅ Diagnostics complete!"