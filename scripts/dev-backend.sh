#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
START_PORT="${PORT:-8000}"
PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"
VENV_UVICORN="${ROOT_DIR}/.venv/bin/uvicorn"

if [[ ! -x "${PYTHON_BIN}" || ! -x "${VENV_UVICORN}" ]]; then
  echo "error: ${ROOT_DIR}/.venv is not ready. Create the virtualenv and install dependencies first." >&2
  exit 1
fi

port_is_available() {
  local port="$1"

  "${PYTHON_BIN}" - "${HOST}" "${port}" <<'PY' >/dev/null 2>&1
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
family = socket.AF_INET6 if ":" in host else socket.AF_INET
sock = socket.socket(family, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

try:
    sock.bind((host, port))
except OSError:
    raise SystemExit(1)
finally:
    sock.close()
PY
}

find_available_port() {
  local port="$1"

  while ! port_is_available "${port}"; do
    echo "Port ${port} is already in use. Trying $((port + 1))..." >&2
    port="$((port + 1))"
  done

  printf '%s\n' "${port}"
}

PORT_TO_USE="$(find_available_port "${START_PORT}")"

if [[ "${PORT_TO_USE}" != "${START_PORT}" ]]; then
  echo "Starting backend on http://${HOST}:${PORT_TO_USE}" >&2
  echo "Frontend override: NEXT_PUBLIC_API_BASE_URL=http://${HOST}:${PORT_TO_USE}/api/v1" >&2
fi

exec "${VENV_UVICORN}" app.main:app --reload --host "${HOST}" --port "${PORT_TO_USE}"
