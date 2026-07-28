# Runbook resumido

## Verificações

```bash
scripts/preflight.sh
scripts/quality-gate.sh
scripts/smoke-test.sh
```

## Build e deploy

```bash
docker compose build backend frontend
docker compose up -d backend frontend
docker compose ps
scripts/smoke-test.sh
```

## Diagnóstico

```bash
docker compose ps
docker compose logs --tail=200 backend frontend
```

Nunca imprimir `.env`, tokens ou credenciais. Nunca reiniciar stacks alheias.

## Rollback

1. identificar o commit/snapshot anterior;
2. verificar compatibilidade do banco;
3. preservar dados e uploads;
4. construir em staging;
5. validar smoke;
6. trocar somente os containers deste compose.

Migration destrutiva requer backup restaurável testado.
