#!/usr/bin/env bash
# Backup diario do PostgreSQL de producao do Whitelabel.
#
# Existe porque ate 2026-08-07 os unicos backups eram manuais e pre-migration:
# o mais recente era de 3 dias antes. O projeto whazing, que nao e vendido,
# tinha backup diario por cron; o Whitelabel, que e o produto, nao tinha.
#
# Formato custom (-Fc) para permitir restore seletivo com pg_restore.
# Instalar em cron como root:
#   15 3 * * * /root/whitelabel-whaticket/scripts/backup-db.sh >> /var/log/whitelabel-backup.log 2>&1
set -euo pipefail

CONTAINER="${PG_CONTAINER:-whitelabel-whaticket-postgres-1}"
DEST="${BACKUP_DIR:-/root/whitelabel-whaticket-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
TARGET="${DEST}/auto-${STAMP}.dump"

log() { printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  log "ERRO: container ${CONTAINER} nao esta rodando; backup abortado."
  exit 1
fi

mkdir -p "$DEST"
chmod 700 "$DEST"

umask 077
log "Iniciando dump de ${CONTAINER}."

# -Fc: formato custom. Falha fechado: sem `|| true`, um dump parcial nao pode
# ser confundido com sucesso.
if ! docker exec "$CONTAINER" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$TARGET" 2>/tmp/whitelabel-backup-err; then
  log "ERRO: pg_dump falhou: $(cat /tmp/whitelabel-backup-err)"
  rm -f "$TARGET"
  exit 1
fi

chmod 600 "$TARGET"

# Um arquivo que existe nao e um backup. Verificar que pg_restore consegue ler
# o catalogo e que ha tabelas dentro.
tables="$(pg_restore --list "$TARGET" 2>/dev/null | grep -c 'TABLE DATA' || true)"
if [ "${tables:-0}" -lt 1 ]; then
  # pg_restore pode nao existir no host; tentar dentro do container.
  tables="$(docker exec -i "$CONTAINER" pg_restore --list /dev/stdin < "$TARGET" 2>/dev/null | grep -c 'TABLE DATA' || true)"
fi

size="$(stat -c %s "$TARGET")"
if [ "${tables:-0}" -lt 1 ] || [ "$size" -lt 10000 ]; then
  log "ERRO: dump invalido (tabelas=${tables:-0}, bytes=${size}); removido."
  rm -f "$TARGET"
  exit 1
fi

log "OK: ${TARGET} (${size} bytes, ${tables} tabelas com dados)."

# Retencao: remove apenas os automaticos. Os dumps manuais pre-migration sao
# marcos historicos e nao devem ser apagados por rotina.
deleted="$(find "$DEST" -maxdepth 1 -name 'auto-*.dump' -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)"
[ "$deleted" -gt 0 ] && log "Retencao: ${deleted} backup(s) automatico(s) com mais de ${RETENTION_DAYS} dias removido(s)."

log "Total de backups: $(find "$DEST" -maxdepth 1 -name '*.dump' | wc -l)."
