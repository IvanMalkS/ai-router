#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Publish all public packages to npm
#
# Automatically bumps versions, commits, tags, and publishes.
#
# Usage:
#   ./scripts/publish.sh           # bump patch (default)
#   ./scripts/publish.sh minor     # bump minor
#   ./scripts/publish.sh major     # bump major
#   DRY_RUN=1 ./scripts/publish.sh # dry run (no publish, no commit)
# ──────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUMP="${1:-patch}"
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

info "Bumping versions ($BUMP)..."
NEW_VER=""
for pkg in "${PACKAGES[@]}"; do
  pushd "$ROOT/$pkg" > /dev/null
  npm version "$BUMP" --no-git-tag-version > /dev/null
  NEW_VER=$(node -p "require('./package.json').version")
  ok "$(node -p "require('./package.json').name") -> $NEW_VER"
  popd > /dev/null
done

# ── Build ────────────────────────────────────────────────────

info "Building all packages..."
pnpm -r --filter='!example-*' build
ok "Build complete"

# ── Verify package contents ──────────────────────────────────

info "Verifying packages (no .map files, no src/)..."
HAS_JUNK=0
for pkg in "${PACKAGES[@]}"; do
  pushd "$ROOT/$pkg" > /dev/null
  NAME=$(node -p "require('./package.json').name")

  # Check for source maps in dist
  if ls dist/*.map 2>/dev/null | head -1 > /dev/null 2>&1; then
    warn "$NAME: removing source maps from dist/"
    rm -f dist/*.map
  fi

  # Check for src/ in files
  if [ -d "src" ] && node -p "JSON.stringify(require('./package.json').files || [])" | grep -q '"src"'; then
    warn "$NAME: 'src' is in the files field — remove it from package.json"
    HAS_JUNK=1
  fi

  popd > /dev/null
done

if [ "$HAS_JUNK" -eq 1 ]; then
  die "Fix package.json files fields before publishing."
fi

ok "Packages are clean"

# ── Dry run exit ─────────────────────────────────────────────

if [ -n "$DRY_RUN" ]; then
  echo ""
  info "Dry run — package contents:"
  for pkg in "${PACKAGES[@]}"; do
    pushd "$ROOT/$pkg" > /dev/null
    NAME=$(node -p "require('./package.json').name")
    echo ""
    info "$NAME:"
    npm pack --dry-run 2>&1 | sed 's/^/    /'
    popd > /dev/null
  done

  # Revert version bumps
  git checkout -- .
  warn "Dry run complete. Version bumps reverted. Nothing published."
  exit 0
fi

# ── Commit & tag ─────────────────────────────────────────────

info "Committing version bump..."
git add -A
git commit -m "release: v${NEW_VER}"
git tag -a "v${NEW_VER}" -m "v${NEW_VER}"
ok "Tagged v${NEW_VER}"

# ── Publish ──────────────────────────────────────────────────

for pkg in "${PACKAGES[@]}"; do
  pushd "$ROOT/$pkg" > /dev/null
  NAME=$(node -p "require('./package.json').name")
  VER=$(node -p "require('./package.json').version")

  info "Publishing $NAME@$VER..."
  npm publish --access public
  ok "$NAME@$VER published"

  popd > /dev/null
done

# ── Push ─────────────────────────────────────────────────────

info "Pushing commits and tags..."
git push && git push --tags
ok "Pushed to remote"

# ── Done ─────────────────────────────────────────────────────

echo ""
ok "All packages published as v${NEW_VER}!"
