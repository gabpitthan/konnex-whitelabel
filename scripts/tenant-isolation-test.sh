#!/usr/bin/env bash
# SEC-001 — prova completa de isolamento multiempresa.
#
# Regressao viva do SEC-001. Rodar a cada lote que toque autorizacao, servico
# de dominio ou rota autenticada.
#
# Cria uma empresa-alvo descartavel com recursos proprios e faz a empresa B tentar
# LER, ALTERAR e APAGAR cada um deles. A empresa A (produção) fica fora: o alvo
# é descartável de propósito, porque provar exclusão indevida DESTRÓI o dado —
# foi assim que o ticket 1 da empresa A se perdeu em 2026-08-07.
set -uo pipefail

API=https://api-whitelabel.usekonnex.com
ADMIN="$(sg docker -c 'docker exec whitelabel-whaticket-backend-1 printenv COMPANY_TOKEN' 2>/dev/null | tr -d '\r\n')"

SUFIXO="$(date +%s)"
# Credenciais efemeras, geradas por execucao. Nada fixo no repositorio, e as
# empresas sao removidas no fim.
SENHA="Iso-$(head -c 12 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')#1"
EMAIL_B="qa-iso-atacante-${SUFIXO}@konnex.local"
EMAIL_C="qa-iso-alvo-${SUFIXO}@konnex.local"

P=0; F=0
ok()  { printf '  \033[32mOK\033[0m    %s\n' "$1"; P=$((P+1)); }
mal() { printf '  \033[31mFALHA\033[0m %s\n' "$1"; F=$((F+1)); }
nota(){ printf '  \033[33m--\033[0m    %s\n' "$1"; }

login() { curl -s -m 25 -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"$2\"}" | jq -r '.token // empty'; }

cria_empresa() { # nome email -> ecoa o id
  curl -s -m 30 -X POST "$API/api/companies" -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$1\",\"email\":\"$2\",\"password\":\"$SENHA\",\"status\":true,\"planId\":1,\"document\":\"$(printf %014d $((RANDOM*100000+RANDOM)))\",\"companyUserName\":\"QA\"}" \
    | jq -r '.id // empty'
}

echo "== Preparacao =="
[ -z "$ADMIN" ] && { echo "COMPANY_TOKEN indisponivel — o teste precisa da API de administracao"; exit 1; }

ID_B=$(cria_empresa "QA Iso atacante ${SUFIXO}" "$EMAIL_B")
ID_C=$(cria_empresa "QA Iso alvo ${SUFIXO}" "$EMAIL_C")
[ -z "$ID_B" ] || [ -z "$ID_C" ] && { echo "nao criou as empresas de teste"; exit 1; }

# Remove as empresas ao sair, aconteca o que acontecer.
limpa() {
  for id in "$ID_B" "$ID_C"; do
    [ -n "$id" ] && curl -s -m 25 -o /dev/null -X DELETE -H "Authorization: Bearer $ADMIN" "$API/api/companies/$id"
  done
  echo "  empresas de teste removidas ($ID_B, $ID_C)"
}
trap limpa EXIT

JWT_B=$(login "$EMAIL_B" "$SENHA"); JWT_C=$(login "$EMAIL_C" "$SENHA")
[ -z "$JWT_B" ] && { echo "sem token do atacante"; exit 1; }
[ -z "$JWT_C" ] && { echo "sem token do alvo"; exit 1; }
ok "empresas de teste criadas e autenticadas (atacante=$ID_B, alvo=$ID_C)"

cria() { # rota json -> ecoa o id
  curl -s -m 25 -X POST "$API/$1" -H "Authorization: Bearer $JWT_C" \
    -H "Content-Type: application/json" -d "$2" | jq -r '.id // .record.id // empty'
}

echo
echo "== Recursos criados na empresa C (alvo) =="
ID_CONTATO=$(cria "contacts" '{"name":"Alvo C","number":"5511988887777","email":""}')
ID_TAG=$(cria      "tags"     '{"name":"tag-alvo-c","color":"#FF0000"}')
ID_FILA=$(cria     "queue"    '{"name":"fila-alvo-c","color":"#00FF00","greetingMessage":"oi"}')
ID_MSG=$(cria      "quick-messages" '{"shortcode":"alvoc","message":"mensagem alvo de C"}')
ID_LISTA=$(cria    "contact-lists"  '{"name":"lista-alvo-c"}')

for par in "contato:$ID_CONTATO" "tag:$ID_TAG" "fila:$ID_FILA" "msg-rapida:$ID_MSG" "lista:$ID_LISTA"; do
  n="${par%%:*}"; v="${par#*:}"
  [ -n "$v" ] && ok "C criou $n id=$v" || nota "C não criou $n (rota ou payload diferente) — fora deste teste"
done

echo
echo "== B tentando LER, ALTERAR e APAGAR recursos da empresa C =="

ataca() { # metodo rota descricao [body] [texto_proibido]
  local m="$1" r="$2" d="$3" b="${4:-}" proib="${5:-}"
  local resp code corpo
  if [ -n "$b" ]; then
    resp=$(curl -s -m 20 -w '\n%{http_code}' -X "$m" -H "Authorization: Bearer $JWT_B" \
      -H "Content-Type: application/json" -d "$b" "$API/$r")
  else
    resp=$(curl -s -m 20 -w '\n%{http_code}' -X "$m" -H "Authorization: Bearer $JWT_B" "$API/$r")
  fi
  code=$(echo "$resp"|tail -1); corpo=$(echo "$resp"|head -n -1)

  case "$m" in
    GET)
      if [ -n "$proib" ] && echo "$corpo" | grep -qiF "$proib"; then
        mal "$d -> HTTP $code VAZOU: $(echo "$corpo"|head -c 130)"
      elif [ "$code" -ge 400 ] 2>/dev/null; then ok "$d -> HTTP $code negado"
      else ok "$d -> HTTP $code sem dado de C"; fi ;;
    *)
      if [ "$code" = "200" ] || [ "$code" = "204" ]; then
        mal "$d -> HTTP $code ACEITOU: $(echo "$corpo"|head -c 130)"
      else ok "$d -> HTTP $code negado ($(echo "$corpo"|head -c 70))"; fi ;;
  esac
}

[ -n "$ID_CONTATO" ] && {
  ataca GET    "contacts/$ID_CONTATO" "ler contato de C"     "" "Alvo C"
  ataca PUT    "contacts/$ID_CONTATO" "alterar contato de C" '{"name":"INVADIDO","number":"5511900000000"}'
  ataca DELETE "contacts/$ID_CONTATO" "apagar contato de C"; }

[ -n "$ID_TAG" ] && {
  ataca PUT    "tags/$ID_TAG" "alterar tag de C" '{"name":"INVADIDO","color":"#000000"}'
  ataca DELETE "tags/$ID_TAG" "apagar tag de C"; }

[ -n "$ID_FILA" ] && {
  ataca GET    "queue/$ID_FILA" "ler fila de C"     "" "fila-alvo-c"
  ataca PUT    "queue/$ID_FILA" "alterar fila de C" '{"name":"INVADIDO","color":"#000000"}'
  ataca DELETE "queue/$ID_FILA" "apagar fila de C"; }

[ -n "$ID_MSG" ] && {
  ataca GET    "quick-messages/$ID_MSG" "ler msg rapida de C"     "" "mensagem alvo de C"
  ataca PUT    "quick-messages/$ID_MSG" "alterar msg rapida de C" '{"shortcode":"invadido","message":"INVADIDO"}'
  ataca DELETE "quick-messages/$ID_MSG" "apagar msg rapida de C"; }

[ -n "$ID_LISTA" ] && {
  ataca GET    "contact-lists/$ID_LISTA" "ler lista de C"     "" "lista-alvo-c"
  ataca PUT    "contact-lists/$ID_LISTA" "alterar lista de C" '{"name":"INVADIDO"}'
  ataca DELETE "contact-lists/$ID_LISTA" "apagar lista de C"; }

echo
echo "== Os recursos de C sobreviveram intactos? =="
sobreviveu() { # rota id nome_esperado descricao
  local corpo; corpo=$(curl -s -m 20 -H "Authorization: Bearer $JWT_C" "$API/$1/$2")
  if echo "$corpo" | grep -qiF "$3"; then ok "$4 intacto"; else mal "$4 alterado ou apagado: $(echo "$corpo"|head -c 110)"; fi
}
[ -n "$ID_CONTATO" ] && sobreviveu "contacts"       "$ID_CONTATO" "Alvo C"            "contato de C"
[ -n "$ID_FILA" ]    && sobreviveu "queue"          "$ID_FILA"    "fila-alvo-c"       "fila de C"
[ -n "$ID_MSG" ]     && sobreviveu "quick-messages" "$ID_MSG"     "mensagem alvo de C" "msg rapida de C"

echo
echo "== Resultado =="
printf "  passou: %s\n  falhou: %s\n" "$P" "$F"
[ "$F" -gt 0 ] && { echo; echo "ISOLAMENTO REPROVADO."; exit 1; }
echo; echo "ISOLAMENTO APROVADO nas superficies testadas."
exit 0
