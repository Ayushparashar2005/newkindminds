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
# Empty means "the SSH user's home" — resolved after the sandbox exists. The sandbox
# login user is normally `user`, not root, so /root is not writable.
APP_DIR="${APP_DIR:-}"

LOCAL=0
if [ "${1:-}" = "--local" ]; then LOCAL=1; fi

if ! command -v boat >/dev/null 2>&1; then
  echo "boat CLI not found. Install it: curl -fsSL https://boat.dev/install | sh" >&2
  exit 1
fi

# The CLI prints friendly text in a terminal and JSON when piped. Pull a field out
# of either, so this works from an agent, a script, or an interactive shell.
json_field() {
  sed -n 's/.*"'"$1"'":"\([^"]*\)".*/\1/p' | head -n1
}

ID="${SANDBOX:-}"
CREATED=0
if [ -z "$ID" ]; then
  echo "==> Creating a $TYPE sandbox"
  OUT="$(boat new --type "$TYPE" --json 2>&1 || true)"
  ID="$(printf '%s' "$OUT" | json_field id)"
  if [ -z "$ID" ]; then
    ID="$(printf '%s' "$OUT" | tail -n1 | tr -d '[:space:]')"
  fi
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

# Resolve where we may actually write inside the sandbox.
if [ -z "$APP_DIR" ]; then
  REMOTE_HOME="$(boat ssh "$ID" -- 'printf %s "$HOME"' 2>/dev/null | tr -d '\r' | tail -n1 || true)"
  case "$REMOTE_HOME" in
    /*) ;;
    *) REMOTE_HOME="/home/user" ;;
  esac
  APP_DIR="$REMOTE_HOME/kindminds"
fi
echo "==> App directory: $APP_DIR"

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
HOST_OUT="$(boat host "$ID" "$PORT" --public --title "KindMinds API" --json 2>&1 || true)"
URL="$(printf '%s' "$HOST_OUT" | json_field url)"
if [ -z "$URL" ]; then
  URL="$(printf '%s' "$HOST_OUT" | tail -n1 | tr -d '\r')"
fi
echo "API URL: $URL"

cat <<EOF

Sandbox id : $ID
API URL    : $URL
Health     : $URL/api/health

Next steps:
  Frontend build variable : PUBLIC_API_URL=$URL/api
  Wake it after a stop    : ./deploy/boat/wake.sh $ID
  24/7 keep-awake (paid)  : boat extend $ID --no-auto-stop
  Follow the logs         : boat ssh $ID -- 'journalctl -u kindminds-api -f'
  Stop billing            : boat stop $ID      (disk is kept, resume with: boat resume $ID)

Trial accounts auto-stop after at most 2 h; the API is unreachable until you resume
the sandbox. Run ./deploy/boat/wake.sh $ID when that happens.
EOF
