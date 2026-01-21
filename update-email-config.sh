#!/bin/bash

# Script to update SMTP_PASSWORD environment variable in GCP Cloud Run
# Usage: ./update-email-config.sh "your-16-character-app-password"

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Gmail App-Specific Password is required"
    echo "Usage: $0 \"abcd efgh ijkl mnop\""
    echo ""
    echo "To get your Gmail App-Specific Password:"
    echo "1. Go to https://myaccount.google.com/security"
    echo "2. Click '2-Step Verification'"
    echo "3. Scroll to 'App passwords' and click 'Generate'"
    echo "4. Select Mail > Other (custom) > 'RRCLOUD Backend'"
    echo "5. Copy the 16-character password"
    exit 1
fi

APP_PASSWORD="$1"
PROJECT_ID="rrcloud-platform"
REGION="us-central1"
SERVICE="rrcloud-backend"

echo "🔧 Updating SMTP configuration for $SERVICE..."

# Update environment variables
gcloud run services update $SERVICE \
    --region=$REGION \
    --update-env-vars="SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_SECURE=false,SMTP_USER=admin@zgenai.org,SMTP_PASSWORD=$APP_PASSWORD" \
    --quiet

echo "✅ Email configuration updated successfully!"
echo ""
echo "The following environment variables are now set:"
echo "  SMTP_HOST=smtp.gmail.com"
echo "  SMTP_PORT=587" 
echo "  SMTP_SECURE=false"
echo "  SMTP_USER=admin@zgenai.org"
echo "  SMTP_PASSWORD=[HIDDEN]"
echo ""
echo "🔄 The service will restart automatically with new configuration."
echo "📧 Test email functionality from admin dashboard."