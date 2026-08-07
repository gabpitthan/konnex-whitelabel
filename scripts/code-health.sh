#!/usr/bin/env bash
# CODE HEALTH GATES — os quatro do ENGINEERING OS (`modules/code_health.md`).
#
#   scripts/code-health.sh            # superfície alterada (git diff contra HEAD)
#   scripts/code-health.sh --repo     # repositório inteiro (lento)
#
# Os gates de corretude respondem "isto funciona?". Estes respondem "um humano
# ainda consegue manter isto daqui a seis meses?".
#
# Gate sem ferramenta no projeto reporta NOT MEASURED com o motivo e o comando
# de instalação. Silêncio seria lido como aprovação, e isso é proibido.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"
BACK=backend
ESCOPO="${1:-}"

COMPLEXIDADE_LIMITE=15
COBERTURA_MINIMA=85

falhas=0
naomedidos=0
titulo() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
ok()     { printf '  \033[32mOK\033[0m          %s\n' "$1"; }
falha()  { printf '  \033[31mFALHA\033[0m       %s\n' "$1"; falhas=$((falhas+1)); }
alerta() { printf '  \033[33mATENCAO\033[0m     %s\n' "$1"; }
nmedido(){ printf '  \033[33mNAO MEDIDO\033[0m  %s\n' "$1"; naomedidos=$((naomedidos+1)); }
tem()    { [ -x "$BACK/node_modules/.bin/$1" ] || command -v "$1" >/dev/null 2>&1; }

# arquivos .ts alterados neste lote
alterados() {
  git diff HEAD --name-only --diff-filter=ACM 2>/dev/null \
    | grep -E '^backend/src/.*\.ts$' | grep -v '__tests__' || true
}

# ---------------------------------------------------------------- 1. LOAD
titulo "1. LOAD — requests/s e cauda de latência"
if tem autocannon; then
  nmedido "autocannon presente, mas o alvo não está definido em .forge/config ou equivalente"
elif tem k6 || tem oha || tem hey; then
  nmedido "ferramenta de carga presente; falta o cenário versionado"
else
  nmedido "sem ferramenta de carga instalada.
                 Instalar:  npm i -D autocannon   (ou k6/oha)
                 Medir p50/p95/p99 e erro sob concorrência nas rotas do lote,
                 comparando com o baseline anterior. Média sozinha esconde a
                 cauda, que é onde o usuário vive."
fi

# ------------------------------------------------------------ 2. COVERAGE
titulo "2. COVERAGE — cobertura do diff e tendência"
if [ -f "$BACK/coverage/coverage-summary.json" ] || [ -f "$BACK/coverage/lcov.info" ]; then
  ok "relatório de cobertura encontrado (gerado pelo gate)"
else
  nmedido "sem relatório. Rodar: cd backend && npx jest --coverage
                 Instrução de TDD NÃO produz teste: o agente pula os que acha
                 tediosos e reporta sucesso de boa-fé. Cobertura é como se
                 descobre — medir sempre, nunca aceitar a alegação."
fi
if [ -f "$BACK/coverage/coverage-summary.json" ]; then
  linhas=$(jq -r '.total.lines.pct // 0' "$BACK/coverage/coverage-summary.json" 2>/dev/null)
  ramos=$(jq -r '.total.branches.pct // 0' "$BACK/coverage/coverage-summary.json" 2>/dev/null)
  printf '              linhas %s%% · ramos %s%% (mínimo do diff: %s%%)\n' "$linhas" "$ramos" "$COBERTURA_MINIMA"
  awk -v l="$linhas" -v m="$COBERTURA_MINIMA" 'BEGIN{exit !(l+0 < m+0)}' \
    && alerta "abaixo do mínimo — legado: segurar a linha na superfície alterada (catraca)" \
    || ok "acima do mínimo"
fi

# ---------------------------------------------------- 3. CYCLOMATIC COMPLEXITY
titulo "3. COMPLEXITY — complexidade ciclomática por função"
if tem eslint; then
  arquivos=$(alterados)
  [ "$ESCOPO" = "--repo" ] && arquivos=$(find "$BACK/src" -name '*.ts' -not -path '*__tests__*')
  if [ -z "$arquivos" ]; then
    ok "nenhum arquivo .ts alterado neste lote"
  else
    saida=$(cd "$BACK" && echo "$arquivos" | sed 's|^backend/||' | xargs -r ./node_modules/.bin/eslint \
      --no-eslintrc --parser @typescript-eslint/parser \
      --rule "{\"complexity\":[\"error\",$COMPLEXIDADE_LIMITE]}" \
      --format compact 2>/dev/null | grep -i "complexity" || true)
    n=$(printf '%s' "$saida" | grep -c . || true)
    if [ "${n:-0}" -eq 0 ]; then
      ok "nenhuma função alterada acima de $COMPLEXIDADE_LIMITE"
    else
      falha "$n função(ões) acima de $COMPLEXIDADE_LIMITE:"
      printf '%s\n' "$saida" | head -12 | sed 's/^/                /'
      printf '                Extrair os ramos em funções nomeadas. Dividir só pela\n'
      printf '                métrica é pior que a métrica — a divisão tem que deixar\n'
      printf '                o código legível.\n'
    fi
  fi
else
  nmedido "eslint indisponível"
fi

# -------------------------------------------------------- 4. DEPENDENCY GRAPH
titulo "4. DEPENDENCY — ciclos, acoplamento e violação de camada"
if tem madge; then
  ciclos=$(cd "$BACK" && ./node_modules/.bin/madge --circular --extensions ts src 2>/dev/null | grep -c "^[0-9]" || echo 0)
  [ "${ciclos:-0}" -eq 0 ] && ok "nenhuma dependência circular" || falha "$ciclos ciclo(s) — nenhum lado pode ser entendido, testado ou substituído sozinho"
else
  nmedido "sem analisador de grafo instalado.
                 Instalar:  npm i -D madge          -> madge --circular --extensions ts src
                        ou  npm i -D dependency-cruiser  (permite declarar as
                            regras de camada, e aí a próxima violação falha
                            sozinha em vez de ser achada por inspeção)
                 Acoplamento é a decadência mais lenta e menos visível: cada
                 import parecia razoável isoladamente, e depois uma correção
                 quebra três módulos."
fi

# ---------------------------------------------------------------- resultado
titulo "Resultado"
printf '  falhas: %s\n  não medidos: %s\n' "$falhas" "$naomedidos"
if [ "$naomedidos" -gt 0 ]; then
  printf '\n  Gate não medido NÃO é gate aprovado. Reportar como NOT MEASURED na\n'
  printf '  evidência da entrega, com o motivo — nunca omitir.\n'
fi
[ "$falhas" -gt 0 ] && exit 1
exit 0
