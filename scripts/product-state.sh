#!/usr/bin/env bash
# Baseline de PRODUTO, nao de codigo.
#
# Existe porque as versoes 1.17-1.31 passaram no preflight, no quality-gate e
# no smoke-test com nota alta enquanto a producao tinha 0 mensagens, 0 tickets
# e 0 contatos, e a unica conexao WhatsApp estava DISCONNECTED havia semanas.
# Nenhum gate perguntava se o produto funcionava para um cliente: todos
# perguntavam se o codigo do lote estava correto.
#
# Rodar no INICIO de qualquer sessao, antes de escolher o proximo lote.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

PG_CONTAINER="${PG_CONTAINER:-whitelabel-whaticket-postgres-1}"

run_sql() {
  docker exec "$PG_CONTAINER" sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -F"|" -c "$0"' "$1" 2>/dev/null
}

echo "== Estado do produto =="
echo "versao declarada: $(tr -d '[:space:]' < VERSION)"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${PG_CONTAINER}$"; then
  echo "AVISO: container ${PG_CONTAINER} nao esta rodando; sem baseline de dados."
  exit 0
fi

echo
echo "-- Volume real (producao) --"
run_sql 'select '\''empresas'\'', count(*) from "Companies"
  union all select '\''usuarios'\'', count(*) from "Users"
  union all select '\''conexoes'\'', count(*) from "Whatsapps"
  union all select '\''contatos'\'', count(*) from "Contacts"
  union all select '\''tickets'\'', count(*) from "Tickets"
  union all select '\''mensagens'\'', count(*) from "Messages"' |
  while IFS='|' read -r label value; do
    printf '  %-12s %s\n' "$label" "$value"
  done

echo
echo "-- Conexoes WhatsApp --"
conns="$(run_sql 'select id, name, status, coalesce(number, '\''-'\'') from "Whatsapps" order by id')"
if [ -z "$conns" ]; then
  echo "  nenhuma conexao cadastrada"
else
  printf '%s\n' "$conns" | while IFS='|' read -r id name status number; do
    printf '  #%-3s %-20s %-14s %s\n' "$id" "$name" "$status" "$number"
  done
fi

echo
echo "-- Trafego --"
last_in="$(run_sql 'select coalesce(to_char(max("createdAt"), '\''YYYY-MM-DD HH24:MI'\''), '\''nunca'\'') from "Messages" where "fromMe" = false')"
last_out="$(run_sql 'select coalesce(to_char(max("createdAt"), '\''YYYY-MM-DD HH24:MI'\''), '\''nunca'\'') from "Messages" where "fromMe" = true')"
last_24h="$(run_sql 'select count(*) from "Messages" where "createdAt" > now() - interval '\''24 hours'\''')"
printf '  ultima recebida  %s\n' "$last_in"
printf '  ultima enviada   %s\n' "$last_out"
printf '  ultimas 24h      %s mensagens\n' "$last_24h"

echo
echo "-- Integridade de identidade --"
lid="$(run_sql 'select count(*) from "Contacts" where "remoteJid" like '\''%@lid'\''')"
printf '  contatos sem telefone (LID)  %s\n' "$lid"

echo
echo "-- Leitura --"
total_msg="$(run_sql 'select count(*) from "Messages"')"
if [ "${total_msg:-0}" -eq 0 ]; then
  echo "  O produto nunca processou uma mensagem. Nenhum lote tecnico deve ser"
  echo "  priorizado antes de provar a jornada basica ponta a ponta."
elif [ "${last_24h:-0}" -eq 0 ]; then
  echo "  Sem trafego nas ultimas 24h; o baseline pode nao refletir uso real."
else
  echo "  Trafego presente."
fi

if [ "${lid:-0}" -gt 0 ]; then
  echo "  Ha contatos gravados com LID no lugar do telefone: eles nao deduplicam"
  echo "  com a base importada e quebram campanha, relatorio e integracao."
fi
