#!/usr/bin/env bash
# Wakes a stopped boat sandbox and waits until the KindMinds API answers again.
#
# Trial accounts auto-stop after at most 2 h, after which the public API URL is
# unreachable and the frontend shows empty lists. Run this when that happens:
#
#   ./deploy/boat/wake.sh <sandbox-id> [port]
#
# The systemd unit is enabled, so the API starts by itself on resume — this only
# resumes the VM, re-prints the public URL and polls its health endpoint.
set -euo pipefail

ID="${1:-${SANDBOX:-}}"
PORT="${2:-8001}"

if [ -z "$ID" ]; then
  echo "usage: $0 <sandbox-id> [port]" >&2
  exit 1
fi
if ! command -v boat >/dev/null 2>&1; then
  echo "boat CLI not found: curl -fsSL https://boat.dev/install | sh" >&2
  exit 1
fi

echo "==> Resuming $ID"
boat resume "$ID"

echo "==> Publishing port $PORT"
URL="$(boat host "$ID" "$PORT" --public | tail -n1 | tr -d '\r')"
echo "API: $URL"

echo "==> Waiting for the API to answer"
for i in $(seq 1 90); do
  if curl -fsS "$URL/api/health" >/dev/null 2>&1; then
    echo "Healthy after ${i}s: $URL/api/health"
    exit 0
  fi
  sleep 1
done

echo "Still not healthy. Inspect the service with:" >&2
echo "  boat ssh $ID -- 'systemctl status kindminds-api; journalctl -u kindminds-api -n 50'" >&2
exit 1
