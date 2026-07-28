# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.9

## Em foco

Programa P0 de confiabilidade. A 1.9 entrega a primeira fase do lifecycle WhatsApp e auth state Redis fail-closed, sem afirmar que o programa inteiro está concluído.

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
- Auth state v2 é tenant-aware, versionado, validado por checksum e mantém rollback legado.
- Starts concorrentes no mesmo processo são coalescidos e sockets antigos recebem geração inválida.
- Logout, reset e exclusão agora limpam o estado realmente usado pelo runtime.

## Próximo passo

Concluir `REL-002/003` com lease Redis/fencing, registry completo, cleanup de listeners/timers, shutdown e manifesto atômico. Depois validar em uma conta canário: QR, conexão, texto, mídia, queda de rede, restart e logout.

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
