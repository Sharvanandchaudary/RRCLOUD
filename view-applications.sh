#!/bin/bash
# View and Clear Applications Data

echo "📊 Application Management Tool"
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
BACKEND_URL=$(gcloud run services describe rrcloud-backend --region=us-central1 --format="value(status.url)" 2>/dev/null)

echo "🔧 Backend: $BACKEND_URL"
echo ""

# View all applications
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Current Applications in Database:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s "$BACKEND_URL/api/applications")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Count: $(echo "$RESPONSE" | jq '. | length' 2>/dev/null || echo "?")"
echo ""

# Show unique emails
echo "📧 Emails in database:"
echo "$RESPONSE" | jq -r '.[].email' 2>/dev/null | sort | uniq

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 To submit a NEW application:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Use a different email address than the ones above!"
echo ""
echo "Try:"
echo "  • newuser@example.com"
echo "  • john.smith@example.com"  
echo "  • test123@example.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  To clear ALL test data (optional):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run SQL commands directly via Cloud Run exec:"
echo ""
echo "gcloud sql connect rrcloud-db --user=postgres --database=sharvanandchaudhary"
echo ""
echo "When prompted for password, enter: Admin@123456"
echo ""
echo "Then run:"
echo "  DELETE FROM applications;"
echo "  SELECT COUNT(*) FROM applications;"
echo "  \\q"
echo ""
