# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.4

## Em foco

Base de engenharia autônoma implantada. O projeto está aguardando o primeiro pedido funcional do usuário.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- Não existe suíte automatizada relevante; builds Docker são o gate atual.
- Preflight, quality gate e smoke da versão 1.4 foram aprovados.

## Próximo passo

Receber o primeiro pedido funcional, registrá-lo em `tasks/ACTIVE.md` e executar o fluxo de `docs/DEVELOPMENT_WORKFLOW.md`.

## Fontes

- Arquitetura: `docs/project/ARCHITECTURE.md`
- Prioridades: `docs/project/ROADMAP.md`
- Problemas: `docs/project/ISSUES.md`
- Testes: `docs/project/TEST_MATRIX.md`
- Operação: `docs/project/RUNBOOK.md`
- Decisões: `docs/decisions/`
