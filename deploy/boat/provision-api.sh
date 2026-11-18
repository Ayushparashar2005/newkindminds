#!/usr/bin/env bash
# KindMinds API provisioning — runs INSIDE a boat sandbox (Ubuntu, root or sudo user).
# Idempotent: re-run it any time to update the code and restart the service.
#
#   boat ssh <sandbox-id> -- "APP_DIR=/root/kindminds PORT=8001 bash -s" \
#     < deploy/boat/provision-api.sh
#
# Env knobs:
#   APP_DIR=/root/kindminds   where the code lives (kept in the sandbox snapshot)
#   PORT=8001                 API port (avoid 22, 6080, 8090, 8911, 47984-48010)
#   REPO_URL=<git url>        source for a fresh clone
#   BRANCH=main
#   SKIP_CODE=1               code is already unpacked in APP_DIR, just build+restart
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/kindminds}"
PORT="${PORT:-8001}"
REPO_URL="${REPO_URL:-https://github.com/Ayushparashar2005/newkindminds.git}"
BRANCH="${BRANCH:-main}"
SERVICE="kindminds-api"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

say() { printf '\n==> %s\n' "$*"; }

# --- 1. code -------------------------------------------------------------
if [ "${SKIP_CODE:-0}" != "1" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    say "Updating $APP_DIR from $REPO_URL ($BRANCH)"
    git -C "$APP_DIR" fetch --quiet --depth 1 origin "$BRANCH"
    git -C "$APP_DIR" reset --quiet --hard "origin/$BRANCH"
  else
    say "Cloning $REPO_URL into $APP_DIR"
    mkdir -p "$(dirname "$APP_DIR")"
    git clone --quiet --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
fi
cd "$APP_DIR"

# --- 2. python + dependencies -------------------------------------------
say "Installing Python dependencies"
if ! python3 -c 'import venv, ensurepip' >/dev/null 2>&1; then
  $SUDO apt-get update -qq
  $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq python3-venv >/dev/null
fi
python3 -m venv backend/.venv
backend/.venv/bin/pip install --quiet --upgrade pip
backend/.venv/bin/pip install --quiet -r backend/requirements.txt

# --- 3. runtime configuration (.env) ------------------------------------
if [ ! -f .env ]; then
  say "Creating .env — add GROQ_API_KEY later to enable AI features"
  cat > .env <<ENV
# KindMinds backend config: read by systemd (EnvironmentFile) and by pydantic-settings.
# SQLite lives next to the code, so it is captured by the sandbox snapshot.
DATABASE_URL=sqlite:///./kindminds_dev.db
BACKEND_PORT=$PORT
GROQ_API_KEY=
JWT_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
ENV
  chmod 600 .env
fi

# --- 4. systemd service (comes back after stop / resume / fork) ---------
say "Installing systemd unit $SERVICE"
$SUDO tee "/etc/systemd/system/$SERVICE.service" >/dev/null <<UNIT
[Unit]
Description=KindMinds API (FastAPI on :$PORT)
After=network-online.target
Wants=network-online.target

[Service]
User=$(id -un)
WorkingDirectory=$APP_DIR
EnvironmentFile=-$APP_DIR/.env
Environment=PYTHONUNBUFFERED=1
Environment=BACKEND_PORT=$PORT
ExecStart=$APP_DIR/backend/.venv/bin/python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips=*
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

$SUDO systemctl daemon-reload
$SUDO systemctl enable "$SERVICE" >/dev/null 2>&1 || true
$SUDO systemctl restart "$SERVICE"

# --- 5. wait for the health check ---------------------------------------
say "Waiting for http://127.0.0.1:$PORT/api/health"
ok=0
for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then ok=1; break; fi
  sleep 1
done
if [ "$ok" != "1" ]; then
  echo "Service did not become healthy. Last 40 log lines:" >&2
  $SUDO journalctl -u "$SERVICE" -n 40 --no-pager >&2 || true
  exit 1
fi
curl -fsS "http://127.0.0.1:$PORT/api/health"; echo

say "Done. Expose the port from your machine: boat host <sandbox-id> $PORT --public"
