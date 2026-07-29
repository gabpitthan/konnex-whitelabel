#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

test -f .env
docker compose ps --status running redis >/dev/null
docker build --target build -t whitelabel-whaticket-backend-test backend
docker run --rm \
  --network whitelabel_internal \
  --env-file .env \
  whitelabel-whaticket-backend-test \
  sh -c 'TEST_REDIS_URI="redis://:${REDIS_PASS}@redis:6379" npx jest src/libs/__tests__/whatsappLeaseRedis.integration.spec.ts --runInBand --coverage=false'

echo "Integração do lease com Redis 7 aprovada."
