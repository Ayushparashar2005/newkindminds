#!/usr/bin/env bash
# Builds the Astro frontend with the boat API URL inlined, then deploys it to
# Cloudflare Pages. Run on your machine (Git Bash or WSL on Windows).
#
#   ./deploy/cloudflare/deploy-frontend.sh https://<sandbox>-8001.on.boat.dev
#   API_ORIGIN=https://... PROJECT=kindminds ./deploy/cloudflare/deploy-frontend.sh
#
# The API origin is baked into the bundle at build time, so a new API URL always
# needs a rebuild — that is why this is one script instead of two steps.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_ORIGIN="${1:-${API_ORIGIN:-}}"
PROJECT="${PROJECT:-kindminds}"
BRANCH="${BRANCH:-main}"
# Account that owns the Pages project; override if you deploy elsewhere.
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-d43fc4fcde0d367489891df2cff4b0de}"

if [ -z "$API_ORIGIN" ]; then
  echo "usage: $0 <api-origin>    e.g. https://box-node-xxxx-8001.on.boat.dev" >&2
  exit 1
fi
API_ORIGIN="${API_ORIGIN%/}"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required" >&2
  exit 1
fi

cd "$ROOT/frontend"

if [ ! -d node_modules/astro ]; then
  echo "==> Installing frontend dependencies"
  if command -v pnpm >/dev/null 2>&1; then pnpm install --silent; else npm install --silent; fi
fi

echo "==> Building with PUBLIC_API_URL=$API_ORIGIN/api"
export PUBLIC_API_URL="$API_ORIGIN/api"
node node_modules/astro/astro.js build

# Fail loudly if the URL did not make it into the bundle.
if ! grep -rqF "$API_ORIGIN/api" dist/_astro/*.js; then
  echo "Build finished but $API_ORIGIN/api is not in dist/_astro — refusing to deploy." >&2
  exit 1
fi
echo "==> Verified the API URL is inlined in the bundle"

echo "==> Deploying to Cloudflare Pages project '$PROJECT' (branch $BRANCH)"
export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"
if command -v wrangler >/dev/null 2>&1; then
  wrangler pages deploy dist --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true
else
  npx --yes wrangler pages deploy dist --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true
fi

echo
echo "Frontend: https://$PROJECT.pages.dev"
