#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

docker run --rm \
  --network whitelabel_internal \
  --env-file "$PROJECT_DIR/.env" \
  whitelabel-whaticket-backend-test \
  sh -c 'TEST_REDIS_URI="redis://:${REDIS_PASS}@redis:6379" npx jest src/libs/__tests__/apiRateLimitRedis.integration.spec.ts --runInBand --coverage=false'
