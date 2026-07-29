# Estado atual e handoff

Atualizado em: 2026-07-29
Versão ativa: 1.10

## Em foco

Programa P0 de confiabilidade. A 1.10 foi publicada com drain/shutdown
coordenado e purge Redis não bloqueante como pré-requisitos do futuro
lease/fencing distribuído.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- A suíte P0 ainda não cobre todo o produto, mas possui 22 testes focados em auth state, lifecycle local, shutdown state, Redis e Socket.IO.
- Socket.IO usa namespace autenticado, IDs numéricos e sala de ticket segregada por empresa.
- Testes: 8/8 aprovados; navegador autenticado desktop/mobile limpo.
- Prova runtime: namespace próprio aceito e estrangeiro rejeitado.
- Auth state v2 é tenant-aware, versionado, validado por checksum e mantém rollback legado.
- Starts concorrentes no mesmo processo são coalescidos e sockets antigos recebem geração inválida.
- Logout, reset e exclusão agora limpam o estado realmente usado pelo runtime.
- Novos starts são recusados durante drain.
- Reinício encerra timers, listeners de sessão, WebSockets e Socket.IO sem logout/purge de auth.
- Limpeza por pattern usa `SCAN` + `UNLINK`, sem `KEYS`.
- `server-cluster.ts` falha explicitamente até existir exclusividade distribuída real.
- API e frontend publicados em `1.10`.
- Restart real entregou `SIGTERM` diretamente ao Node e concluiu o cleanup
  monitorado em 2 ms; smoke pós-restart aprovado.

## Próximo passo

Concluir `REL-002/003` com lease Redis/fencing + CAS no banco, registry/disposers completo e manifesto atômico. Depois validar em uma conta canário: QR, conexão, texto, mídia, queda de rede, restart e logout.

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
