#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$ROOT/mcpb/staging"
OUTPUT="$ROOT/typewright-website-audit.mcpb"

rm -rf "$STAGING"
mkdir -p "$STAGING/server" "$STAGING/assets"

cp "$ROOT/mcpb/manifest.json" "$STAGING/manifest.json"
cp "$ROOT/server/audit-mcp.js" "$STAGING/server/audit-mcp.js"
cp "$ROOT/assets/icon-128.png" "$STAGING/assets/icon-128.png"

npx -y @anthropic-ai/mcpb@2.1.2 validate "$STAGING/manifest.json"
npx -y @anthropic-ai/mcpb@2.1.2 pack "$STAGING" "$OUTPUT"
npx -y @anthropic-ai/mcpb@2.1.2 info "$OUTPUT"

echo "Built $OUTPUT"
openssl dgst -sha256 "$OUTPUT"
