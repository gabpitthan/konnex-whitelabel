#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

"$PROJECT_DIR/scripts/preflight.sh"

echo "Executando a suíte P0 em uma imagem de build isolada..."
docker build --target build -t whitelabel-whaticket-backend-test "$PROJECT_DIR/backend"
docker run --rm whitelabel-whaticket-backend-test \
  npx jest \
  src/database/migrations/__tests__/enforceActiveTicketIdempotency.spec.ts \
  src/database/migrations/__tests__/enforceApiCredentialIntegrity.spec.ts \
  src/database/migrations/__tests__/createApiCredentials.spec.ts \
  src/database/migrations/__tests__/addApiCredentialUsageTelemetry.spec.ts \
  src/database/migrations/__tests__/enablePgStatStatements.spec.ts \
  src/database/migrations/__tests__/addScheduleDispatchClaims.spec.ts \
  src/database/migrations/__tests__/addCampaignShippingDispatchState.spec.ts \
  src/database/migrations/__tests__/alignCampaignShippingContactForeignKey.spec.ts \
  src/database/migrations/__tests__/alignCampaignPendingIndex.spec.ts \
  src/database/migrations/__tests__/createDispatchReconciliationAudits.spec.ts \
  src/helpers/__tests__/useMultiFileAuthState.spec.ts \
  src/helpers/__tests__/ResolveContactJid.spec.ts \
  src/jobs/__tests__/handleMessageAckQueue.spec.ts \
  src/jobs/__tests__/handleMessageQueue.spec.ts \
  src/libs/__tests__/redisPattern.spec.ts \
  src/libs/__tests__/sessionStartRegistry.spec.ts \
  src/libs/__tests__/shutdownState.spec.ts \
  src/libs/__tests__/httpClients.spec.ts \
  src/libs/__tests__/queueReliability.spec.ts \
  src/libs/__tests__/queueConfiguration.spec.ts \
  src/libs/__tests__/ssrfProtection.spec.ts \
  src/libs/__tests__/socketContract.spec.ts \
  src/libs/__tests__/whatsappFence.spec.ts \
  src/libs/__tests__/whatsappLease.spec.ts \
  src/middleware/__tests__/apiRateLimit.spec.ts \
  src/middleware/__tests__/tokenAuth.spec.ts \
  src/routes/__tests__/routeMountContract.spec.ts \
  src/routes/__tests__/bullBoardRemovalContract.spec.ts \
  src/routes/__tests__/dispatchReconciliationContract.spec.ts \
  src/services/ApiServices/__tests__/RecordApiUsageService.spec.ts \
  src/services/ApiServices/__tests__/ApiTokenCryptoService.spec.ts \
  src/services/ApiServices/__tests__/GenerateApiTokenService.spec.ts \
  src/services/ApiServices/__tests__/GetApiCredentialMigrationStatusService.spec.ts \
  src/services/ApiServices/__tests__/NormalizeApiContactNumberService.spec.ts \
  src/services/ApiServices/__tests__/RotateApiTokenService.spec.ts \
  src/services/ApiServices/__tests__/RevokeApiTokenService.spec.ts \
  src/services/ApiServices/__tests__/ResolveApiCredentialService.spec.ts \
  src/services/ApiServices/__tests__/SerializeApiWhatsappService.spec.ts \
  src/services/ContactServices/__tests__/UpsertWhatsappContactService.spec.ts \
  src/services/ContactServices/__tests__/FindWhatsappContactByJidService.spec.ts \
  src/services/CampaignService/__tests__/CampaignDispatchStateServices.spec.ts \
  src/services/CampaignService/__tests__/CampaignQueueContract.spec.ts \
  src/services/CampaignService/__tests__/CampaignTenantContract.spec.ts \
  src/services/HealthServices/__tests__/GetReadinessService.spec.ts \
  src/services/MessageServices/__tests__/GetMessageRangeService.spec.ts \
  src/services/MessageServices/__tests__/CreateMessageService.spec.ts \
  src/services/MessageServices/__tests__/PersistFencedMessageService.spec.ts \
  src/services/MessageServices/__tests__/ListMessagesServiceAll.spec.ts \
  src/services/SocketServices/__tests__/AuthorizeTicketRoomService.spec.ts \
  src/services/WbotServices/__tests__/DispatchIntegrationWebhookService.spec.ts \
  src/services/ScheduleServices/__tests__/ClaimDueSchedulesService.spec.ts \
  src/services/ScheduleServices/__tests__/ReleaseScheduleDispatchClaimService.spec.ts \
  src/services/ScheduleServices/__tests__/BeginScheduleDispatchService.spec.ts \
  src/services/ScheduleServices/__tests__/ScheduleQueueContract.spec.ts \
  src/services/ScheduleServices/__tests__/ResolveScheduleDispatchOutcome.spec.ts \
  src/services/DispatchReconciliationServices/__tests__/ListDispatchReconciliationsService.spec.ts \
  src/services/DispatchReconciliationServices/__tests__/ReconcileDispatchService.spec.ts \
  src/services/TicketServices/__tests__/FindOrCreateTicketService.spec.ts \
  src/services/WbotServices/__tests__/FindOrCreateFencedWhatsappContextService.spec.ts \
  src/services/WhatsappService/__tests__/ListAllWhatsAppService.spec.ts \
  src/utils/__tests__/logger.spec.ts \
  --runInBand --coverage=false

echo "Compilando backend e frontend em imagens reproduzíveis..."
bash -n "$PROJECT_DIR/scripts/postgres-observability-report.sh"
docker compose build backend frontend

echo "Gate de compilação aprovado."
echo "A entrega ainda exige o gate de runtime descrito em CLAUDE.md (secao "Definicao de pronto"): navegador autenticado, console/rede, responsividade, observabilidade e smoke."
