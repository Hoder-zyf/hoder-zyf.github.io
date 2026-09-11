#!/usr/bin/env bash
# Serve this directory locally. Usage: ./start.sh [port]
set -euo pipefail

site_port="${1:-8035}"
if ! [[ "$site_port" =~ ^[0-9]{1,5}$ ]] || (( 10#$site_port < 1 || 10#$site_port > 65535 )); then
    echo "Error: port must be an integer between 1 and 65535." >&2
    exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: Python 3 is required." >&2
    exit 1
fi

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
echo "Serving http://localhost:${site_port}"
echo "Press Ctrl+C to stop the server"
exec python3 -m http.server "$site_port" --bind 127.0.0.1
