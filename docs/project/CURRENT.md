# Estado atual e handoff

Atualizado em: 2026-08-03
Versão ativa: 1.28

## Em foco

Programa P0/P1 de integridade e escala. A 1.28 aplica owner, estado persistido,
UUID/CAS e recuperação de enqueue a CampaignShipping. O lote está publicado e
não promete exactly-once do WhatsApp.

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
- Tokens novos usam CSPRNG backend e só aparecem em create/rotate.
- Listas, detalhe, updates, sockets e upload não dependem de expor/reler token.
- `/whatsapp/all` foi corrigido para o tenant autenticado.
- 26 suítes/90 testes, builds e runtime 1.19 passaram; shutdown em 1 ms.
- Tokens novos são armazenados somente como HMAC-SHA-256 com pepper externo ou
  subchave HKDF domain-separated do master existente.
- Lookup por prefixo reduz candidatos; comparação usa `timingSafeEqual`.
- Rotate/revoke usam transação e row lock; o anterior permanece em `grace` por
  15 minutos e pode ser revogado atomicamente.
- Backup pré-1.20 foi restaurado e a migration passou em up/down/up.
- Produção criou tabela, coluna e quatro índices em 216 ms.
- 30 suítes/101 testes, builds, API 1.20, compatibilidade legada e negativa 401
  foram aprovados.
- Smoke encontrou e corrigiu `checkNumber` sem número: entrada agora é
  normalizada/validada e retorna 400; sete casos adicionais passaram.
- Contexto autenticado distingue somente `legacy|digest`, sem token/prefixo.
- Os contadores entram no mesmo UPSERT diário e não alteram `UsedOnDay`.
- Relatório admin é tenant-aware e bloqueia contract antes de 30 dias, uso
  digest e ausência total de legado ativo/usado.
- Backup pré-1.21 foi restaurado e migration passou em up/down/up em 31–42 ms.
- 33 suítes/113 testes e builds passaram; produção aplicou migration em 92 ms.
- Runtime mostrou uma credencial legada ativa e readiness falso, como esperado.
- API 1.21, frontend 200 e restart em 2 ms foram aprovados.
- `pg_stat_statements` opera com 5.000 entradas, top-level, planning/utility off.
- Relatório local retorna apenas agregados e query IDs, sem texto SQL/PII.
- Laboratório PostgreSQL 16 e restore up/down/up aprovaram configuração/rollback.
- Gate passou em 34 suítes/115 testes e ambos os builds; logger ganhou teste
  ISO UTC adicional.
- Produção aplicou extensão em 113 ms; API 1.22, frontend 200 e restart em 2 ms.
- Primeiro snapshot: 2/100 conexões, cache 99,9936%, zero locks, idle
  transaction, deadlocks e temp spill; pior máximo 14,322 ms.
- Clientes externos não confiáveis agora negam redes privadas/especiais,
  validam todos os A/AAAA por conexão e entregam o IP aprovado ao socket.
- Redirect, proxy e socket path estão desabilitados; pools são limitados a 32
  sockets e 4 livres por protocolo.
- Gate 1.25 passou em 38 suítes/157 testes e builds; produção, smoke e bloqueio
  controlado de metadata passaram sem expor URL/IP/token/tenant no log.
- Nenhum índice/cache/tuning foi aplicado por falta de evidência de gargalo.
- Logger deixou timestamp local ambíguo e agora emite ISO-8601 UTC correto.
- `messageRoutes` possui um único mount e o webhook social existe somente em
  `/webhook`; a raiz voltou ao 404 normal.
- Gate 1.23 passou em 36 suítes/118 testes e ambos os builds; API 1.23,
  frontend 200 e containers saudáveis foram confirmados em produção.
- Axios backend 1.18.0 coincide com a tag upstream e possui SLSA provenance;
  1.376 assinaturas e 19 attestations do grafo instalado foram verificadas.
- JSON, mídia e upload possuem budgets próprios de 15/30/60 s, 5/25 MiB de
  resposta, 5/32 MiB de corpo e três redirects.
- Erros Axios serializados ocultam Authorization e parâmetros de token; métodos
  Meta deixaram de embutir token na URL.
- Audit runtime caiu de 77 para 75 achados; Axios e seus transitivos corrigidos
  não aparecem mais. Permanecem 8 críticos em famílias legadas.
- Gate 1.24 passou em 37 suítes/124 testes e ambos os builds; API 1.24,
  smoke e budgets runtime foram aprovados.
- Janela PostgreSQL de 2026-08-02: cache 99,9951%, 2/100 conexões, zero locks,
  deadlocks, idle transaction e temp spill; nenhum tuning é necessário.
- Bull 3.29.3 é at-least-once; ACK/mensagem agora propagam erros para retry/DLQ.
- Completed retém 1 h/100 e failed 7 dias/500; logs omitem payload e mensagem.
- ACK desabilitado não cria mais clientes Redis vazios nem loop de erro.
- Gate completo 40/168, correção final 4/14 e builds passaram; produção 1.26,
  DLQ induzida e smoke foram aprovados.
- Restart fechou seis filas sem falhas em 538 ms; ACK desabilitado fechou zero.
- Schedule usa claim PostgreSQL bounded/ordenado com SKIP LOCKED e UUID estável.
- Redis recebe somente scheduleId/companyId/dispatchKey, nunca snapshot/contato.
- Execução AGENDADA→PROCESSANDO exige tenant, chave e status exatos; duplicata
  retorna antes de carregar dados ou enviar.
- companyId de Schedules é NOT NULL e três índices cobrem due/recovery/UUID.
- Laboratório PG16 dividiu 20 claims em 7/7/6/0; CAS iniciou 1 de 2 workers.
- Gate 1.27 passou em 46 suítes/178 testes e builds; migration produção 170 ms.
- API 1.27, runtime controlado, smoke e restart em 568 ms foram aprovados.
- CampaignShipping ganhou owner/FK composta, unicidade, estado validado e CAS;
  confirmação cria uma única segunda fase com UUID nova.
- Endpoints show/update/delete/media/cancel/restart de campanha agora usam o
  tenant autenticado; o scanner não interpola mais ID em SQL.
- Create/update validam ContactList/Whatsapp/User/Queue no tenant; workers de
  preparação/disparo usam consultas leves, evitando carregar N contatos N vezes.
- Índice parcial do scanner segue `updatedAt,id` e inclui IDs/tenant/chave.
- Backup pré-1.28 0600/SHA-256 e cadeia final up/down/up em 232/162/255 ms;
  execução e confirmação concorrentes produziram 1/0.
- Gate 52 suítes/197 testes e builds passou; produção migrou estado/FK/índice
  em 162/51/57 ms e confirmou FK CASCADE e índice coberto.
- Prova publicada com rollback deu CAS/confirm 1/0, sem dado sintético; API
  1.28, frontend, smoke e restart em 557 ms foram aprovados.

## Próximo passo

Implementar reconciliação segura dos estados PROCESSING sem retry cego. Em
paralelo, selecionar a próxima família vulnerável alcançável,
coordenar a rotação do cliente API e manter a janela de 30 dias antes do
contract.

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
