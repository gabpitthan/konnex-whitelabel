#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

"$PROJECT_DIR/scripts/preflight.sh"

echo "Compilando backend e frontend em imagens reproduzíveis..."
docker compose build backend frontend

echo "Quality gate aprovado. Testes automatizados ainda são uma lacuna registrada em docs/project/ISSUES.md."
