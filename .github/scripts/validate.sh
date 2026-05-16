#!/usr/bin/env bash
set -euo pipefail

errors=0
for var in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID AUTH_PASSWORD AUTH_SECRET D1_DATABASE_ID VITE_API_BASE EMAIL_DOMAIN; do
  if [ -z "${!var}" ]; then
    echo "::error::Missing required: $var"
    errors=$((errors+1))
  fi
done

if [ $errors -gt 0 ]; then
  echo "::error::$errors required secret(s)/variable(s) are missing. Check Settings → Secrets and variables → Actions."
  exit 1
fi

echo "✅ All required secrets and variables are configured"
