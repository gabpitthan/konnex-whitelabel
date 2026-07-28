# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.5

## Em foco

Primeira fundação do redesign integral implantada com a identidade aprovada **Konnex Signal**; aguardando validação visual do usuário.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- Não existe suíte automatizada relevante; builds Docker são o gate atual.
- Preflight, quality gate e smoke da versão 1.4 foram aprovados.

## Próximo passo

Coletar a avaliação do usuário na URL publicada e continuar a migração das áreas especializadas em subversões controladas.

## Fontes

- Arquitetura: `docs/project/ARCHITECTURE.md`
- Prioridades: `docs/project/ROADMAP.md`
- Problemas: `docs/project/ISSUES.md`
- Testes: `docs/project/TEST_MATRIX.md`
- Operação: `docs/project/RUNBOOK.md`
- Decisões: `docs/decisions/`
