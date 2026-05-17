#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$(dirname "$SCRIPT_DIR")"

# Load .dev.vars for D1_DATABASE_ID (remote mode)
if [ -f "$WORKER_DIR/.dev.vars" ]; then
  set -a
  source "$WORKER_DIR/.dev.vars"
  set +a
fi

# ── Interactive prompts ──

echo "选择导出目标:"
echo "  1) 本地  (local)"
echo "  2) 远程  (remote)"
read -rp "输入 [1/2]: " target_choice
case "$target_choice" in
  1) MODE="local" ;;
  2) MODE="remote" ;;
  *) echo "[error] 无效选择"; exit 1 ;;
esac

echo ""
echo "选择导出内容:"
echo "  1) 仅结构     (schema only)"
echo "  2) 仅数据     (data only)"
echo "  3) 结构+数据  (schema and data)"
read -rp "输入 [1/2/3]: " content_choice
case "$content_choice" in
  1) DATA_FLAG="--no-data" ;;        # 仅结构
  2) DATA_FLAG="--no-schema" ;;      # 仅数据
  3) DATA_FLAG="" ;;                  # 结构+数据
  *) echo "[error] 无效选择"; exit 1 ;;
esac

# Build output filename
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT="${WORKER_DIR}/backup-${MODE}-${TIMESTAMP}.sql"
echo ""

# ── Export ──

if [ "$MODE" = "remote" ]; then
  if [ -z "${D1_DATABASE_ID:-}" ]; then
    echo "[error] 远程导出需要 D1_DATABASE_ID，请在 .dev.vars 中配置"
    exit 1
  fi

  TEMP_CONFIG=$(mktemp)
  trap "rm -f $TEMP_CONFIG" EXIT

  cat "$WORKER_DIR/wrangler.jsonc" | \
    sed "s/GITHUB ACTION AUTO INJECT vars\.D1_DATABASE_ID/$D1_DATABASE_ID/" \
    > "$TEMP_CONFIG"

  echo "[info] 正在导出远程数据库..."
  # shellcheck disable=SC2086
  npx wrangler d1 export edge-mail-db --remote --output="$OUTPUT" --config="$TEMP_CONFIG" -y $DATA_FLAG

else
  echo "[info] 正在导出本地数据库..."
  # shellcheck disable=SC2086
  npx wrangler d1 export edge-mail-db --local --output="$OUTPUT" --config="$WORKER_DIR/wrangler.jsonc" -y $DATA_FLAG
fi

echo "[done] 已导出到 $OUTPUT"
