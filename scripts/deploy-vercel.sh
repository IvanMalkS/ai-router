#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Deploy examples to Vercel
#
# Usage:
#   ./scripts/deploy-vercel.sh              # deploy preview
#   ./scripts/deploy-vercel.sh --prod       # deploy to production
#   DRY_RUN=1 ./scripts/deploy-vercel.sh    # build only, don't deploy
#
# Prerequisites:
#   npm i -g vercel
#   vercel login
# ──────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE_DIR="$ROOT/examples/nextjs-docs"
DRY_RUN="${DRY_RUN:-}"
PROD_FLAG=""

if [[ "${1:-}" == "--prod" ]]; then
  PROD_FLAG="--prod"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()   { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ── Pre-checks ───────────────────────────────────────────────

command -v pnpm   >/dev/null 2>&1 || die "pnpm is required"
command -v vercel >/dev/null 2>&1 || die "vercel CLI is required. Install: npm i -g vercel"

# ── Build library packages ───────────────────────────────────

info "Building library packages..."
pushd "$ROOT" > /dev/null
pnpm -r --filter='!example-*' build
ok "Library build complete"
popd > /dev/null

# ── Dry run exit ─────────────────────────────────────────────

if [ -n "$DRY_RUN" ]; then
  info "Building docs site (dry run)..."
  pushd "$EXAMPLE_DIR" > /dev/null
  pnpm build
  popd > /dev/null
  warn "Dry run complete. Skipping deploy."
  exit 0
fi

# ── Deploy to Vercel ─────────────────────────────────────────

info "Deploying to Vercel${PROD_FLAG:+ (production)}..."
pushd "$EXAMPLE_DIR" > /dev/null

DEPLOY_URL=$(vercel $PROD_FLAG --yes)

popd > /dev/null

ok "Deployed successfully!"
echo ""
info "URL: $DEPLOY_URL"
