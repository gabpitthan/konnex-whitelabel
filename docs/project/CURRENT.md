# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.8

## Em foco

Programa P0 de confiabilidade. O contrato Socket.IO e o isolamento de namespace foram corrigidos na 1.8; o próximo foco é o ciclo de sessão WhatsApp e o auth state Redis.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- Não existe suíte automatizada relevante; isso é P0.
- Versão `1.7` publicada no commit `933e247`.
- Build, deploy, smoke, Error Boundary e navegador autenticado desktop/mobile foram validados na 1.7.
- Socket.IO usa namespace autenticado, IDs numéricos e sala de ticket segregada por empresa.
- Testes: 8/8 aprovados; navegador autenticado desktop/mobile limpo.
- Prova runtime: namespace próprio aceito e estrangeiro rejeitado.

## Próximo passo

Executar `REL-002` e `REL-003`: ciclo de vida single-flight e auth state Redis das sessões WhatsApp. Em paralelo futuro, transformar o QA temporário de Socket.IO em E2E permanente e retirar gradualmente a ponte de namespaces legados.

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
