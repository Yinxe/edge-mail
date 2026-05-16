#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${EMAIL_DOMAIN:?EMAIL_DOMAIN not set}"
NEED_SETUP=false

# 1. Check if Email Routing is enabled (DNS records exist)
echo "🔍 Checking Email Routing status for $DOMAIN..."
if npx wrangler email routing dns get "$DOMAIN" > /dev/null 2>&1; then
  echo "✅ Email Routing already enabled"
else
  echo "⚠️  Email Routing not enabled, will configure..."
  NEED_SETUP=true
fi

# 2. Check if routing rule to worker exists
echo "🔍 Checking routing rules..."
RULES=$(npx wrangler email routing rules list 2>&1)
if echo "$RULES" | grep -q "edge-mail-worker"; then
  echo "✅ Routing rule to edge-mail-worker already exists"
else
  echo "⚠️  No routing rule to worker found, will create..."
  NEED_SETUP=true
fi

if [ "$NEED_SETUP" = false ]; then
  echo "✅ Email Routing fully configured, skipping setup"
  exit 0
fi

# 3. Enable routing if needed
echo "🔧 Enabling Email Routing for $DOMAIN..."
npx wrangler email routing enable "$DOMAIN"

# 4. Create routing rule if needed
echo "🔧 Creating routing rule *@$DOMAIN → edge-mail-worker..."
npx wrangler email routing rules create "$DOMAIN" --action=worker --destination=edge-mail-worker

echo "✅ Email Routing configured successfully"
