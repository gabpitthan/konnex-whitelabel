#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

version="$(tr -d '[:space:]' < VERSION)"
backend_version="$(node -p "require('./backend/package.json').version")"
frontend_version="$(node -p "require('./frontend/package.json').version")"

test "$version" = "$backend_version"
test "$version" = "$frontend_version"
test -f "docs/versions/$version/README.md"
test -f "docs/project/CURRENT.md"
test -f "tasks/ACTIVE.md"
git diff --check
docker compose config --quiet

if git ls-files | grep -Eq '(^|/)(\.env|credentials\.txt)$'; then
  echo "ERRO: arquivo sensível rastreado pelo Git." >&2
  exit 1
fi

echo "Preflight aprovado para a versão $version."
