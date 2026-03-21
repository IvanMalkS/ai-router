#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Deploy examples to GitHub Pages (local script)
#
# This builds the Next.js docs site and pushes the static output
# to the gh-pages branch. GitHub Pages serves from that branch.
#
# Usage:
#   ./scripts/deploy-examples.sh                  # auto-detect repo name
#   ./scripts/deploy-examples.sh my-repo-name     # explicit base path
#   DRY_RUN=1 ./scripts/deploy-examples.sh        # build only, don't push
# ──────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE_DIR="$ROOT/examples/nextjs-docs"
OUT_DIR="$EXAMPLE_DIR/out"
DEPLOY_BRANCH="gh-pages"
DRY_RUN="${DRY_RUN:-}"

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

command -v pnpm >/dev/null 2>&1 || die "pnpm is required"
command -v git  >/dev/null 2>&1 || die "git is required"

# ── Detect base path ─────────────────────────────────────────

if [ -n "${1:-}" ]; then
  REPO_NAME="$1"
else
  REMOTE_URL=$(git -C "$ROOT" remote get-url origin 2>/dev/null || echo "")
  if [ -z "$REMOTE_URL" ]; then
    die "No git remote found. Pass repo name as argument: ./scripts/deploy-examples.sh <repo-name>"
  fi
  REPO_NAME=$(basename -s .git "$REMOTE_URL")
fi

BASE_PATH="/$REPO_NAME"

info "Base path: $BASE_PATH"

# ── Build library packages ───────────────────────────────────

info "Building library packages..."
pushd "$ROOT" > /dev/null
pnpm -r --filter='!example-*' build
ok "Library build complete"
popd > /dev/null

# ── Build docs site ──────────────────────────────────────────

info "Building docs site..."
pushd "$EXAMPLE_DIR" > /dev/null
# Write base path to .env.local to avoid MSYS path conversion on Windows
# (Git Bash converts "/foo" env vars to "C:/Program Files/Git/foo" in child processes)
# Use trap to guarantee cleanup even if build fails
echo "NEXT_PUBLIC_BASE_PATH=$BASE_PATH" > .env.local
trap 'rm -f "$EXAMPLE_DIR/.env.local"' EXIT
pnpm build
ok "Docs site built -> $OUT_DIR"
popd > /dev/null

# Check output exists
[ -d "$OUT_DIR" ] || die "Output directory not found: $OUT_DIR"

# ── Add .nojekyll ────────────────────────────────────────────

touch "$OUT_DIR/.nojekyll"

# ── Dry run exit ─────────────────────────────────────────────

if [ -n "$DRY_RUN" ]; then
  warn "Dry run complete. Output at: $OUT_DIR"
  exit 0
fi

# ── Deploy to gh-pages ───────────────────────────────────────

info "Deploying to $DEPLOY_BRANCH branch..."

CURRENT_BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)
COMMIT_SHA=$(git -C "$ROOT" rev-parse --short HEAD)
COMMIT_MSG="docs: deploy examples from $CURRENT_BRANCH@$COMMIT_SHA"

# Create a temp directory for deployment
DEPLOY_DIR=$(mktemp -d)
trap 'rm -rf "$DEPLOY_DIR"' EXIT

cp -r "$OUT_DIR/." "$DEPLOY_DIR/"

pushd "$DEPLOY_DIR" > /dev/null
git init -b "$DEPLOY_BRANCH"
git add -A
git commit -m "$COMMIT_MSG"

REMOTE_URL=$(git -C "$ROOT" remote get-url origin)
git push "$REMOTE_URL" "$DEPLOY_BRANCH" --force
popd > /dev/null

ok "Deployed to $DEPLOY_BRANCH branch!"
echo ""
info "GitHub Pages URL will be available at:"
info "  https://$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]([^/]+)/.*|\1|').github.io$BASE_PATH"
