#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

expected="$(tr -d '[:space:]' < VERSION)"
actual=""

for attempt in $(seq 1 30); do
  response="$(curl --fail --silent http://127.0.0.1:3007/version 2>/dev/null || true)"
  if actual="$(printf '%s' "$response" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).version" 2>/dev/null)" && test -n "$actual"; then
    break
  fi
  actual=""
  sleep 1
done

test "$expected" = "$actual"
curl --fail --silent --show-error --head http://127.0.0.1:8090 >/dev/null
docker compose ps --status running backend frontend >/dev/null

echo "Smoke aprovado: frontend ativo e API na versão $actual."
