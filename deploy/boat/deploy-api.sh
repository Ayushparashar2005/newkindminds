#!/usr/bin/env bash
# Creates (or reuses) a boat sandbox, provisions the KindMinds API there, and
# prints the public HTTPS URL. Runs on YOUR machine, not in the sandbox.
#
#   ./deploy/boat/deploy-api.sh                 # clone from GitHub into a fresh sandbox
#   ./deploy/boat/deploy-api.sh --local         # push this working tree instead (unpushed changes)
#   SANDBOX=bx_xxxx ./deploy/boat/deploy-api.sh # update an existing sandbox
#
# Requires the boat CLI: curl -fsSL https://boat.dev/install | sh
# (on Windows: irm https://boat.dev/install.ps1 | iex, then run this from Git Bash or WSL)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_URL="${REPO_URL:-https://github.com/Ayushparashar2005/newkindminds.git}"
TYPE="${TYPE:-small}"          # small = 2 vCPU / 4 GB at $0.018/h — the cheapest always-on size
PORT="${PORT:-8001}"
APP_DIR="${APP_DIR:-/root/kindminds}"

LOCAL=0
if [ "${1:-}" = "--local" ]; then LOCAL=1; fi

if ! command -v boat >/dev/null 2>&1; then
  echo "boat CLI not found. Install it: curl -fsSL https://boat.dev/install | sh" >&2
  exit 1
fi

ID="${SANDBOX:-}"
CREATED=0
if [ -z "$ID" ]; then
  echo "==> Creating a $TYPE sandbox"
  ID="$(boat new --type "$TYPE" | tail -n1 | tr -d '[:space:]')"
  CREATED=1
fi
case "$ID" in
  bx_*) ;;
  *)
    echo "Could not read a sandbox id from 'boat new' (got: '$ID')." >&2
    echo "Create one with 'boat new --type $TYPE', then re-run: SANDBOX=<id> $0 $*" >&2
    exit 1
    ;;
esac
echo "==> Sandbox: $ID"

if [ "$CREATED" = "1" ]; then
  # Trial accounts are capped at 2 h of auto-stop (paid plans can disable it entirely).
  echo "==> Extending the auto-stop window to 2 h"
  boat extend "$ID" --hours 2 >/dev/null 2>&1 || echo "    (auto-stop left unchanged)"
fi

if [ "$LOCAL" = "1" ]; then
  echo "==> Pushing the working tree"
  TARBALL="$(mktemp -t kindminds-api).tgz"
  tar -czf "$TARBALL" -C "$ROOT" \
    --exclude='backend/.venv' --exclude='__pycache__' --exclude='*.db' backend
  boat scp "$TARBALL" "$ID:/tmp/kindminds-api.tgz"
  boat ssh "$ID" -- "mkdir -p '$APP_DIR' && tar -xzf /tmp/kindminds-api.tgz -C '$APP_DIR'"
  PREFIX="SKIP_CODE=1"
else
  PREFIX="REPO_URL='$REPO_URL'"
fi

echo "==> Provisioning the API (venv, dependencies, systemd, health check)"
boat ssh "$ID" -- "APP_DIR='$APP_DIR' PORT='$PORT' $PREFIX bash -s" \
  < "$ROOT/deploy/boat/provision-api.sh"

echo "==> Exposing port $PORT as a public HTTPS URL"
boat host "$ID" "$PORT" --public --title "KindMinds API"

cat <<EOF

Sandbox id : $ID
Health     : <API URL above>/api/health

Next steps:
  Frontend build variable : PUBLIC_API_URL=<API URL above>/api
  Wake it after a stop    : ./deploy/boat/wake.sh $ID
  24/7 keep-awake (paid)  : boat extend $ID --no-auto-stop
  Follow the logs         : boat ssh $ID -- 'journalctl -u kindminds-api -f'
  Stop billing            : boat stop $ID      (disk is kept, resume with: boat resume $ID)

Trial accounts auto-stop after at most 2 h; the API is unreachable until you resume
the sandbox. Run ./deploy/boat/wake.sh $ID when that happens.
EOF
