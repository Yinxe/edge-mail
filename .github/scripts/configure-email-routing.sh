#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${EMAIL_DOMAIN:?EMAIL_DOMAIN not set}"
SCOPE="${EMAIL_SCOPE:-}"
API_URL="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/email/routing/rules"
AUTH="-H Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# Determine matcher based on scope
if [ -z "$SCOPE" ]; then
  # Default: root domain only
  MATCHER='{"type":"email","field":"to","value":"*@'"$DOMAIN"'"}'
  echo "📧 Scope: root domain only (*@$DOMAIN)"
elif [ "$SCOPE" = "*" ]; then
  # Catch-all: everything including subdomains
  MATCHER='{"type":"catch_all"}'
  echo "📧 Scope: catch-all (all domains and subdomains)"
else
  # Custom pattern (e.g. *@edu.codex.yoga)
  MATCHER='{"type":"email","field":"to","value":"'"$SCOPE"'"}'
  echo "📧 Scope: $SCOPE"
fi

# Check if a routing rule to edge-mail-worker already exists
echo "🔍 Checking routing rules..."
RULE_EXISTS=$(curl -s "$API_URL" $AUTH | \
  jq -e '[.result[] | select(.actions[0].value[0] == "edge-mail-worker" and .enabled == true)] | length > 0')

if [ "$RULE_EXISTS" = "true" ]; then
  echo "✅ Routing rule to edge-mail-worker already exists, skipping"
else
  echo "🔧 Creating routing rule..."
  BODY=$(cat <<EOF
{
  "actions": [{"type":"worker","value":["edge-mail-worker"]}],
  "matchers": [$MATCHER],
  "enabled": true,
  "name": "edge-mail-worker"
}
EOF
)
  RESPONSE=$(curl -s -X POST "$API_URL" $AUTH \
    -H "Content-Type: application/json" \
    -d "$BODY")
  if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Routing rule created"
  else
    echo "❌ Failed: $(echo "$RESPONSE" | jq -r '.errors[0].message // "unknown error"')"
    exit 1
  fi
fi

echo "✅ Email Routing configured successfully"
