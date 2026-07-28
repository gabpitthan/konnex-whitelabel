#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

"$PROJECT_DIR/scripts/preflight.sh"

echo "Compilando backend e frontend em imagens reproduzíveis..."
docker compose build backend frontend

echo "Gate de compilação aprovado."
echo "A entrega ainda exige o gate de runtime descrito em docs/DEFINITION_OF_DONE.md: navegador autenticado, console/rede, responsividade, observabilidade e smoke."
