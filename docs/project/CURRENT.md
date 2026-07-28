# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.7

## Em foco

Programa P0 de confiabilidade. A versão 1.7 estabilizou shell e tela branca; a pesquisa posterior confirmou riscos críticos em Socket.IO, multi-tenancy e ciclo de sessão WhatsApp.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- Não existe suíte automatizada relevante; isso é P0.
- Versão `1.7` publicada no commit `933e247`.
- Build, deploy, smoke, Error Boundary e navegador autenticado desktop/mobile foram validados na 1.7.
- Socket.IO possui incompatibilidades de JWT, IDs e namespace confirmadas por análise estática; teste tenant A/B é o próximo gate.

## Próximo passo

Executar `REL-001`: corrigir autenticação e isolamento multi-tenant do Socket.IO com teste real de dois tenants. Depois executar `REL-002` e `REL-003` para ciclo de vida e auth state das sessões WhatsApp. A pesquisa e o protocolo permanente estão em `docs/JARVIS_ENGINEERING_SYSTEM.md`, `docs/research/WHATICKET_RELIABILITY_2026.md` e `docs/project/RELIABILITY_BACKLOG.md`.

## Fontes

- Arquitetura: `docs/project/ARCHITECTURE.md`
- Prioridades: `docs/project/ROADMAP.md`
- Problemas: `docs/project/ISSUES.md`
- Testes: `docs/project/TEST_MATRIX.md`
- Operação: `docs/project/RUNBOOK.md`
- Sistema Jarvis: `docs/JARVIS_ENGINEERING_SYSTEM.md`
- Pesquisa: `docs/research/WHATICKET_RELIABILITY_2026.md`
- Backlog de confiabilidade: `docs/project/RELIABILITY_BACKLOG.md`
- Decisões: `docs/decisions/`
