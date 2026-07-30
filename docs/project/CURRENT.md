# Estado atual e handoff

Atualizado em: 2026-07-30
Versão ativa: 1.18

## Em foco

Programa P0 de integridade e escala. A 1.18 foi publicada com rate limiting
distribuído da API por identidade autenticada.

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
- Backend/frontend possuem healthchecks; readiness exige aplicação fora de
  drain, PostgreSQL e Redis disponíveis.
- Conexões ociosas da aplicação caíram de 6 para 1 após estabilização.
- Redis está em `noeviction` com AOF `everysec`; como guarda auth/leases, não
  será tratado como cache descartável.
- `Messages(companyId,wid)` agora é único; criação e reload são transacionais e
  Socket.IO ocorre após commit.
- Backup pré-1.13 foi restaurado com sucesso; o primeiro rollout falhou fechado
  ao encontrar dependência de constraint e foi recuperado sem alteração de dados.
- Quoted messages WhatsApp/Facebook, ACK direto/Bull e deleção consultam Message
  por `wid + companyId`.
- A regressão total passou em 13 suítes/48 testes; smoke da API 1.14 passou
  antes/depois do restart e o shutdown fechou recursos em 4 ms.
- A transação de mensagem bloqueia `Whatsapps` pelo fence e o Ticket pelo
  tenant/conexão; Socket.IO ocorre somente após commit.
- A regressão total passou em 14 suítes/53 testes; smoke da API 1.15 passou
  antes/depois do restart e o shutdown fechou recursos em 3 ms.
- Contact e Ticket inicial são persistidos sob o row lock do fence; chamadas de
  perfil permanecem fora da transação.
- Ticket WhatsApp ativo é único por tenant/contato/conexão.
- `unreadMessages` usa incremento atômico PostgreSQL; Redis é somente espelho.
- Backup foi restaurado com 57 tabelas e a migration passou em up/down/up.
- Produção aplicou o índice em 77 ms; 18 suítes/62 testes, builds, smoke e
  restart passaram; shutdown fechou recursos em 1 ms.
- Bearer determina conexão, tenant e canal sem confiar em `companyId` externo.
- Token e uso diário possuem índices únicos parciais; contabilização usa UPSERT.
- Backup 1.17 restaurou 57 tabelas e migration passou em up/down/up.
- Produção aplicou os índices em 113 ms; 21 suítes/81 testes e builds passaram.
- API 1.17, negativa 401 e restart passaram; shutdown fechou recursos em 2 ms.
- Rate limit usa Lua atômico, TTL e chave tenant/conexão sem credencial.
- Integração Redis 7 aprovou concorrência 1–20 e isolamento entre conexões.
- 22 suítes/85 testes, builds, API 1.18 e restart passaram; shutdown em 3 ms.

## Próximo passo

Projetar digest e rotação dual dos tokens e revogação auditável. Em seguida
habilitar medição de queries e validar WhatsApp em conta canário.

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
