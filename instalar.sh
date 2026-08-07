#!/usr/bin/env bash
# Instalador do Konnex Whitelabel.
#
#   ./instalar.sh
#
# Faz quatro perguntas, gera todo o resto e deixa o CRM no ar.
#
# Por que existe: a instalação manual pede 41 variáveis de ambiente, dez delas
# segredos criptográficos que a pessoa teria que gerar sozinha. Errar uma não
# dá erro visível — a aplicação sobe e fica insegura. Aqui os segredos são
# gerados, nunca digitados.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

VERDE=$'\033[32m'; VERM=$'\033[31m'; AMAR=$'\033[33m'; NEG=$'\033[1m'; FIM=$'\033[0m'
ok()    { printf "  ${VERDE}✓${FIM} %s\n" "$1"; }
erro()  { printf "  ${VERM}✗${FIM} %s\n" "$1"; }
aviso() { printf "  ${AMAR}!${FIM} %s\n" "$1"; }
titulo(){ printf "\n${NEG}%s${FIM}\n" "$1"; }

segredo() { # gera um segredo forte, sem depender de openssl
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 48 | tr -d '\n=+/' | cut -c1-64
  else
    head -c 96 /dev/urandom | base64 | tr -d '\n=+/' | cut -c1-64
  fi
}

# ---------------------------------------------------------------- pré-requisitos
titulo "1. Conferindo o servidor"

falta=0
if command -v docker >/dev/null 2>&1; then ok "Docker instalado"; else
  erro "Docker não encontrado. Instale com:  curl -fsSL https://get.docker.com | sh"; falta=1
fi
if docker compose version >/dev/null 2>&1; then ok "Docker Compose v2"; else
  erro "Docker Compose v2 não encontrado (o comando é 'docker compose', não 'docker-compose')"; falta=1
fi
if docker info >/dev/null 2>&1; then ok "Docker está rodando e seu usuário tem permissão"; else
  erro "Sem permissão para falar com o Docker. Rode:  sudo usermod -aG docker \$USER   e abra o terminal de novo"; falta=1
fi

mem=$(awk '/MemTotal/{printf "%d", $2/1024/1024}' /proc/meminfo 2>/dev/null || echo 0)
if [ "${mem:-0}" -ge 4 ]; then ok "Memória: ${mem} GB"
elif [ "${mem:-0}" -ge 2 ]; then aviso "Memória: ${mem} GB — funciona, mas 4 GB é o recomendado"
else erro "Memória: ${mem} GB — abaixo do mínimo de 2 GB"; falta=1; fi

disco=$(df -BG --output=avail . 2>/dev/null | tail -1 | tr -dc '0-9')
if [ "${disco:-0}" -ge 10 ]; then ok "Espaço livre: ${disco} GB"
else aviso "Espaço livre: ${disco} GB — recomendado pelo menos 10 GB"; fi

for porta in 8090 3007; do
  if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ":${porta} "; then
    erro "A porta ${porta} já está em uso — pare o serviço que a ocupa ou ajuste o compose.yaml"; falta=1
  else ok "Porta ${porta} livre"; fi
done

[ "$falta" -gt 0 ] && { printf "\n${VERM}Corrija os itens acima e rode de novo.${FIM}\n"; exit 1; }

# ---------------------------------------------------------------- .env existente
if [ -f .env ]; then
  titulo "Já existe um arquivo .env"
  printf "  Continuar vai SOBRESCREVER a configuração atual.\n"
  printf "  Uma cópia será guardada como .env.backup-%s\n\n" "$(date +%Y%m%d-%H%M%S)"
  read -r -p "  Sobrescrever? (digite SIM para continuar): " conf
  [ "$conf" != "SIM" ] && { echo "  Cancelado."; exit 0; }
  cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"
fi

# ---------------------------------------------------------------- perguntas
titulo "2. Quatro perguntas"
printf "  Tudo o mais é gerado automaticamente.\n\n"

while :; do
  read -r -p "  Domínio do painel (ex: crm.suaempresa.com.br): " DOMINIO
  DOMINIO=$(echo "$DOMINIO" | tr -d ' ' | sed -E 's#^https?://##; s#/.*$##')
  [ -n "$DOMINIO" ] && echo "$DOMINIO" | grep -qE '^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' && break
  erro "Domínio inválido. Escreva só o endereço, sem http:// e sem barra."
done

SUGESTAO="api.${DOMINIO}"
read -r -p "  Domínio da API [${SUGESTAO}]: " DOMINIO_API
DOMINIO_API=$(echo "${DOMINIO_API:-$SUGESTAO}" | tr -d ' ' | sed -E 's#^https?://##; s#/.*$##')

while :; do
  read -r -p "  E-mail do administrador: " EMAIL_ADMIN
  echo "$EMAIL_ADMIN" | grep -qE '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' && break
  erro "E-mail inválido."
done

read -r -s -p "  Senha do administrador (deixe vazio para gerar uma): " SENHA_ADMIN; echo
if [ -z "$SENHA_ADMIN" ]; then
  SENHA_ADMIN="$(segredo | cut -c1-20)"
  SENHA_GERADA=1
elif [ "${#SENHA_ADMIN}" -lt 10 ]; then
  aviso "Senha curta; usando uma gerada no lugar."
  SENHA_ADMIN="$(segredo | cut -c1-20)"; SENHA_GERADA=1
fi

read -r -p "  WhatsApp de suporte da sua marca (só números, ex: 5511999998888) [opcional]: " SUPORTE
SUPORTE=$(echo "$SUPORTE" | tr -dc '0-9')

# ---------------------------------------------------------------- .env
titulo "3. Gerando a configuração"

cat > .env <<EOF
# Gerado por instalar.sh em $(date -Iseconds)
# Os segredos abaixo foram gerados automaticamente. Não os compartilhe e não
# versione este arquivo.

FRONTEND_URL=https://${DOMINIO}
BACKEND_URL=https://${DOMINIO_API}
PROXY_PORT=443

DB_NAME=whitelabel
DB_USER=whitelabel
DB_PASS=$(segredo)
DB_POOL_MAX=10
DB_POOL_MIN=1
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

REDIS_PASS=$(segredo)
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000

JWT_SECRET=$(segredo)
JWT_REFRESH_SECRET=$(segredo)
REDIS_SECRET_KEY=$(segredo)
MASTER_KEY=$(segredo)
ENV_TOKEN=$(segredo)
COMPANY_TOKEN=$(segredo)
API_TOKEN_PEPPER=$(segredo)
API_TOKEN_ROTATION_GRACE_SECONDS=900
API_RATE_LIMIT_MAX=30
API_RATE_LIMIT_WINDOW_SECONDS=60
VERIFY_TOKEN=$(segredo | cut -c1-24)

ADMIN_EMAIL=${EMAIL_ADMIN}
ADMIN_PASSWORD=${SENHA_ADMIN}
SUPPORT_NUMBER=${SUPORTE}

USER_LIMIT=10
CONNECTIONS_LIMIT=10
CLOSED_SEND_BY_ME=true
BULL_BOARD=false
DISPATCH_RECONCILIATION_STALE_MS=900000

# Opcionais — preencha depois se for usar.
# Sem SMTP, "esqueci minha senha" e convite de usuário não funcionam.
SENTRY_DSN=
MP_ACCESS_TOKEN=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
EOF
chmod 600 .env
ok "Arquivo .env criado (permissão 600)"
ok "10 segredos gerados — nenhum digitado à mão"

# ---------------------------------------------------------------- Caddy (TLS)
cat > Caddyfile <<EOF
# HTTPS automático. O Caddy emite e renova o certificado sozinho.
# Requer que ${DOMINIO} e ${DOMINIO_API} já apontem para o IP deste servidor.
${DOMINIO} {
    reverse_proxy 127.0.0.1:8090
}

${DOMINIO_API} {
    reverse_proxy 127.0.0.1:3007
}
EOF
ok "Caddyfile criado (HTTPS automático)"

# ---------------------------------------------------------------- subir
titulo "4. Subindo o CRM (a primeira vez demora alguns minutos)"

export RUN_DB_SEEDS=true
if docker compose up --build -d; then ok "Containers iniciados"; else
  erro "Falha ao subir. Veja o erro acima e rode:  docker compose logs --tail=50"; exit 1
fi

printf "\n  Aguardando ficar saudável"
pronto=0
for _ in $(seq 1 60); do
  saudaveis=$(docker compose ps --format '{{.Name}} {{.Status}}' 2>/dev/null | grep -c "healthy")
  if [ "${saudaveis:-0}" -ge 4 ]; then pronto=1; break; fi
  printf "."; sleep 5
done
echo

if [ "$pronto" != 1 ]; then
  erro "Os containers não ficaram saudáveis a tempo."
  printf "  Diagnóstico:  docker compose ps  e  docker compose logs --tail=80 backend\n"
  exit 1
fi
ok "Todos os serviços saudáveis"

# ---------------------------------------------------------------- verificação
titulo "5. Verificando de verdade"

versao=$(curl -fsS -m 10 http://127.0.0.1:3007/version 2>/dev/null | sed -E 's/.*"version":"([^"]+)".*/\1/')
[ -n "$versao" ] && ok "API respondendo — versão ${versao}" || { erro "API não respondeu"; exit 1; }

curl -fsS -m 10 -o /dev/null http://127.0.0.1:3007/health/ready 2>/dev/null \
  && ok "Banco e Redis conectados" || { erro "A aplicação subiu mas não está pronta"; exit 1; }

curl -fsS -m 10 -o /dev/null http://127.0.0.1:8090/ 2>/dev/null \
  && ok "Painel respondendo" || { erro "Painel não respondeu"; exit 1; }

# A prova que importa: a pessoa consegue ENTRAR. Sem isto, o instalador já
# terminou dizendo "instalado" com o banco vazio — os seeds não haviam rodado
# porque a variável não chegava ao container.
login=$(curl -fsS -m 15 -X POST http://127.0.0.1:3007/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL_ADMIN}\",\"password\":\"${SENHA_ADMIN}\"}" 2>/dev/null)

if echo "$login" | grep -q '"token"'; then
  ok "Login do administrador funciona"
else
  erro "A aplicação subiu, mas o administrador NÃO consegue entrar."
  printf "  Os dados iniciais não foram criados. Rode:\n"
  printf "    docker compose exec backend npx sequelize db:seed:all\n"
  printf "    docker compose restart backend\n"
  exit 1
fi

# ---------------------------------------------------------------- fim
printf "\n${VERDE}${NEG}CRM instalado.${FIM}\n\n"
printf "  Painel:  https://%s\n" "$DOMINIO"
printf "  E-mail:  %s\n" "$EMAIL_ADMIN"
if [ "${SENHA_GERADA:-0}" = 1 ]; then
  printf "  Senha:   ${NEG}%s${FIM}\n" "$SENHA_ADMIN"
  printf "\n  ${AMAR}Anote esta senha agora.${FIM} Ela não será mostrada de novo — está no .env,\n"
  printf "  que só o dono do servidor consegue ler.\n"
fi

cat <<EOF

${NEG}Faltam dois passos, que dependem de você:${FIM}

  1. Apontar o DNS
     Crie dois registros A apontando para o IP deste servidor:
       ${DOMINIO}
       ${DOMINIO_API}

  2. Ligar o HTTPS
     Com o DNS propagado, instale o Caddy e use o Caddyfile já criado:
       sudo apt install -y caddy
       sudo cp Caddyfile /etc/caddy/Caddyfile
       sudo systemctl reload caddy
     O certificado é emitido e renovado sozinho.

${NEG}Depois disso:${FIM} entre no painel, vá em Conexões, crie uma e leia o QR code
com o WhatsApp que vai atender.

${NEG}Comandos do dia a dia:${FIM}
  docker compose ps                    ver o estado
  docker compose logs -f backend       acompanhar os logs
  docker compose restart backend       reiniciar
  docker compose down                  parar (sem apagar dados)

EOF
