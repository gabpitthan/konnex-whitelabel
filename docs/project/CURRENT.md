# Estado atual e handoff

Atualizado em: 2026-07-29
Versão ativa: 1.11

## Em foco

Programa P0 de confiabilidade. A 1.11 foi publicada com lease Redis,
fencing PostgreSQL e mutações de lifecycle/auth state condicionadas ao owner.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- A suíte P0 ainda não cobre todo o produto, mas possui 34 testes focados em auth state, lifecycle, lease/fencing, shutdown, Redis e Socket.IO.
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
- Lease usa token opaco, TTL, renovação e release compare-value.
- Fence monotônico é persistido e lifecycle/auth state rejeitam owner obsoleto.
- Perda do lease fecha o socket sem logout/purge; operações destrutivas são
  serializadas e mantêm o lease até o fim.
- Redis indisponível falha fechado e não aceita comandos tardios pela offline queue.
- O modo cluster continua bloqueado: handlers de domínio ainda possuem janela
  TOCTOU entre a checagem do lease e a mutação PostgreSQL.
- Migration aplicada, API/frontend em 1.11 e smoke pós-deploy aprovados.
- Restart real recebeu `SIGTERM`, fechou os recursos em 1 ms e retornou sem
  migration pendente.

## Próximo passo

Propagar o fence até as mesmas transações PostgreSQL de mensagens, tickets,
contatos e contadores. Depois validar em conta canário: QR, conexão, texto,
mídia, queda de rede, restart, perda de lease e logout.

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
