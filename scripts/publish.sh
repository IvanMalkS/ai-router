#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Publish all public packages to npm
#
# Usage:
#   ./scripts/publish.sh           # publish with current versions
#   ./scripts/publish.sh patch     # bump patch, then publish
#   ./scripts/publish.sh minor     # bump minor, then publish
#   ./scripts/publish.sh major     # bump major, then publish
#   DRY_RUN=1 ./scripts/publish.sh # dry run (no actual publish)
# ──────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUMP="${1:-}"
DRY_RUN="${DRY_RUN:-}"

# Packages to publish (order matters — dependencies first)
PACKAGES=(
  "packages/core"
  "packages/plugin-webpack"
  "packages/plugin-vite"
  "packages/plugin-next"
)

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
command -v npm  >/dev/null 2>&1 || die "npm is required"

npm whoami >/dev/null 2>&1 || die "Not logged in to npm. Run: npm login"

# ── Ensure clean working tree ────────────────────────────────

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  die "Working tree is dirty. Commit or stash changes first."
fi

# ── Bump versions ────────────────────────────────────────────

if [ -n "$BUMP" ]; then
  info "Bumping versions ($BUMP)..."
  for pkg in "${PACKAGES[@]}"; do
    pushd "$ROOT/$pkg" > /dev/null
    npm version "$BUMP" --no-git-tag-version
    NEW_VER=$(node -p "require('./package.json').version")
    ok "$(node -p "require('./package.json').name") -> $NEW_VER"
    popd > /dev/null
  done
  info "Don't forget to commit the version bump and tag the release."
fi

# ── Build ────────────────────────────────────────────────────

info "Building all packages..."
pnpm -r --filter='!example-*' build
ok "Build complete"

# ── Publish ──────────────────────────────────────────────────

for pkg in "${PACKAGES[@]}"; do
  pushd "$ROOT/$pkg" > /dev/null
  NAME=$(node -p "require('./package.json').name")
  VER=$(node -p "require('./package.json').version")

  if [ -n "$DRY_RUN" ]; then
    info "[dry-run] Would publish $NAME@$VER"
    npm publish --dry-run 2>&1 | sed 's/^/    /'
  else
    info "Publishing $NAME@$VER..."
    npm publish --access public
    ok "$NAME@$VER published"
  fi

  popd > /dev/null
done

# ── Done ─────────────────────────────────────────────────────

echo ""
if [ -n "$DRY_RUN" ]; then
  warn "Dry run complete. No packages were published."
else
  ok "All packages published successfully!"
fi
