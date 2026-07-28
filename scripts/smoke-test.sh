#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

expected="$(tr -d '[:space:]' < VERSION)"
actual="$(curl --fail --silent --show-error http://127.0.0.1:3007/version | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).version")"

test "$expected" = "$actual"
curl --fail --silent --show-error --head http://127.0.0.1:8090 >/dev/null
docker compose ps --status running backend frontend >/dev/null

echo "Smoke aprovado: frontend ativo e API na versão $actual."
