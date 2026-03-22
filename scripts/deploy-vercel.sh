#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Deploy docs site to Vercel
#
# Pushes the project to Vercel which builds on their servers
# using the commands from vercel.json.
#
# Usage:
#   ./scripts/deploy-vercel.sh              # deploy preview
#   ./scripts/deploy-vercel.sh --prod       # deploy to production
#
# Prerequisites:
#   npm i -g vercel
#   vercel login
# ──────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROD_FLAG=""

if [[ "${1:-}" == "--prod" ]]; then
  PROD_FLAG="--prod"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
die()   { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ── Pre-checks ───────────────────────────────────────────────

command -v vercel >/dev/null 2>&1 || die "vercel CLI is required. Install: npm i -g vercel"

# ── Deploy to Vercel ─────────────────────────────────────────

info "Deploying to Vercel${PROD_FLAG:+ (production)}..."
pushd "$ROOT" > /dev/null

DEPLOY_URL=$(vercel deploy $PROD_FLAG --yes)

popd > /dev/null

ok "Deployed successfully!"
echo ""
info "URL: $DEPLOY_URL"
