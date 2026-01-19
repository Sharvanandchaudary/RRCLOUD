#!/bin/bash
# Get Deployed Website URLs

echo "🌐 Getting Deployed Website URLs..."
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

echo "📋 Project: $PROJECT_ID"
echo ""

# Get backend URL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Backend Service:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_URL=$(gcloud run services describe rrcloud-backend --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$BACKEND_URL" ]; then
    echo "✅ URL: $BACKEND_URL"
    echo ""
    echo "Health Check:"
    curl -s "$BACKEND_URL/health" | jq '.' 2>/dev/null || curl -s "$BACKEND_URL/health"
    echo ""
else
    echo "❌ Not deployed yet"
    echo ""
fi

# Get frontend URL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Frontend Service:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRONTEND_URL=$(gcloud run services describe rrcloud-frontend --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$FRONTEND_URL" ]; then
    echo "✅ URL: $FRONTEND_URL"
    echo ""
else
    echo "❌ Not deployed yet"
    echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DEPLOYMENT SUMMARY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$FRONTEND_URL" ] && [ -n "$BACKEND_URL" ]; then
    echo "✅ Both services deployed successfully!"
    echo ""
    echo "🌐 YOUR WEBSITE:"
    echo "   $FRONTEND_URL"
    echo ""
    echo "🔧 API ENDPOINT:"
    echo "   $BACKEND_URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  UPDATE GITHUB SECRET:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Go to: https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions"
    echo ""
    echo "Update secret: FRONTEND_URL"
    echo "New value: $FRONTEND_URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 TEST YOUR APP:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Open: $FRONTEND_URL"
    echo "2. Click 'Apply Now' to test signup form"
    echo "3. Admin login:"
    echo "   Email: admin@zgenai.com"
    echo "   Password: admin123"
    echo ""
elif [ -n "$BACKEND_URL" ]; then
    echo "⚠️  Only backend deployed"
    echo "   Backend: $BACKEND_URL"
    echo "   Frontend deployment may still be in progress"
    echo ""
else
    echo "❌ Services not found"
    echo ""
    echo "Check deployment status:"
    echo "  gcloud run services list --region=us-central1"
    echo ""
    echo "Or check GitHub Actions:"
    echo "  https://github.com/Sharvanandchaudary/RRCLOUD/actions"
    echo ""
fi
