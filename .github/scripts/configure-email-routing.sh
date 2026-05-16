#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${EMAIL_DOMAIN:?EMAIL_DOMAIN not set}"

# 1. Enable Email Routing if not already done
echo "🔍 Checking Email Routing status for $DOMAIN..."
if npx wrangler email routing dns get "$DOMAIN" > /dev/null 2>&1; then
  echo "✅ Email Routing already enabled"
else
  echo "🔧 Enabling Email Routing for $DOMAIN..."
  npx wrangler email routing enable "$DOMAIN"
fi

# 2. Check and create routing rule if needed
echo "🔍 Checking routing rules..."
if npx wrangler email routing rules list 2>&1 | grep -q "edge-mail-worker"; then
  echo "✅ Routing rule to edge-mail-worker already exists"
else
  echo "🔧 Creating routing rule *@$DOMAIN → edge-mail-worker..."
  npx wrangler email routing rules create "$DOMAIN" --action=worker --destination=edge-mail-worker
fi

echo "✅ Email Routing configured successfully"
