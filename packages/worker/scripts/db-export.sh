#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}"
OUTPUT="${2:-./backup-${MODE}.sql}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$(dirname "$SCRIPT_DIR")"

# Load .dev.vars for D1_DATABASE_ID
if [ -f "$WORKER_DIR/.dev.vars" ]; then
  set -a
  source "$WORKER_DIR/.dev.vars"
  set +a
fi

if [ "$MODE" = "remote" ] && [ -n "${D1_DATABASE_ID:-}" ]; then
  # Build a temp wrangler config with the real UUID
  TEMP_CONFIG=$(mktemp)
  trap "rm -f $TEMP_CONFIG" EXIT

  cat "$WORKER_DIR/wrangler.jsonc" | \
    sed "s/GITHUB ACTION AUTO INJECT vars\.D1_DATABASE_ID/$D1_DATABASE_ID/" \
    > "$TEMP_CONFIG"

  echo "[info] Using temp config with real D1 UUID for remote export..."
  npx wrangler d1 export edge-mail-db --remote --output="$OUTPUT" --config="$TEMP_CONFIG" -y

elif [ "$MODE" = "local" ]; then
  npx wrangler d1 export edge-mail-db --local --output="$OUTPUT" --config="$WORKER_DIR/wrangler.jsonc" -y

else
  echo "Usage: $0 <local|remote> [output-path]"
  echo "  For remote: set D1_DATABASE_ID in .dev.vars or env"
  exit 1
fi

echo "[done] Exported to $OUTPUT"
