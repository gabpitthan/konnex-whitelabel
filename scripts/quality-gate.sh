#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

"$PROJECT_DIR/scripts/preflight.sh"

echo "Executando a suíte P0 em uma imagem de build isolada..."
docker build --target build -t whitelabel-whaticket-backend-test "$PROJECT_DIR/backend"
docker run --rm whitelabel-whaticket-backend-test \
  npx jest \
  src/helpers/__tests__/useMultiFileAuthState.spec.ts \
  src/libs/__tests__/redisPattern.spec.ts \
  src/libs/__tests__/sessionStartRegistry.spec.ts \
  src/libs/__tests__/shutdownState.spec.ts \
  src/libs/__tests__/socketContract.spec.ts \
  src/libs/__tests__/whatsappFence.spec.ts \
  src/libs/__tests__/whatsappLease.spec.ts \
  src/services/HealthServices/__tests__/GetReadinessService.spec.ts \
  src/services/MessageServices/__tests__/GetMessageRangeService.spec.ts \
  src/services/MessageServices/__tests__/CreateMessageService.spec.ts \
  src/services/MessageServices/__tests__/ListMessagesServiceAll.spec.ts \
  src/services/SocketServices/__tests__/AuthorizeTicketRoomService.spec.ts \
  --runInBand --coverage=false

echo "Compilando backend e frontend em imagens reproduzíveis..."
docker compose build backend frontend

echo "Gate de compilação aprovado."
echo "A entrega ainda exige o gate de runtime descrito em docs/DEFINITION_OF_DONE.md: navegador autenticado, console/rede, responsividade, observabilidade e smoke."
