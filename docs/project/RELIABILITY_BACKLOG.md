# Backlog de confiabilidade

## P0 — bloquear evolução quando afetado

### REL-001 — Socket.IO autenticado e multi-tenant

- alinhar payload JWT, IDs e namespace;
- autenticar cada namespace;
- exigir namespace igual ao `companyId` assinado;
- validar ticket/company/queue antes de `join`;
- testar tenant A permitido e tenant B negado;
- testar refresh/relogin/reconnect.

### REL-002 — máquina de estados da sessão WhatsApp

Estado: parcial na 1.10 — single-flight local, generation, timeout, falha propagada e shutdown coordenado.

- `idle`, `pairing`, `connecting`, `connected`, `degraded`, `reconnecting`, `logged_out`, `failed`;
- lock single-flight por sessão;
- epoch/generation para ignorar eventos de socket antigo;
- ampliar o cleanup atual para registry/disposers de todos os listeners/timers especializados;
- diferenciar erro recuperável, autenticação revogada e incidente externo.

### REL-003 — integridade do auth state

Estado: parcial na 1.10 — fail-closed, envelope v2, checksum, ownership, migração lazy e purge por SCAN/UNLINK.

- erro Redis deve falhar de forma segura, nunca virar credencial vazia;
- persistência atômica/versionada;
- namespace com tenant e sessão;
- detecção de estado parcial;
- teste de restart, Redis indisponível e corrupção.

### REL-011 — exclusividade distribuída da sessão WhatsApp

- lease Redis com token único, TTL e renovação;
- fencing token monotônico;
- persistência do fence corrente no PostgreSQL;
- compare-and-set antes de credenciais, mensagens e mudanças de status;
- perda do lease encerra imediatamente o socket sem logout;
- reconciler para sessão órfã;
- testes com dois processos e pausas maiores que o TTL.

### REL-004 — suíte mínima P0

- login;
- tenant A/B;
- socket;
- criar/aceitar/fechar ticket;
- mensagem texto/mídia;
- QR, conexão e reconexão;
- persistência após restart.

## P1 — confiabilidade operacional

### REL-005 — idempotência e Bull

- identificar jobs críticos;
- chave idempotente e constraint;
- outbox/afterCommit;
- attempts, backoff, jitter e timeout;
- métricas `active`, `failed`, `stalled`, duração e lag.

### REL-006 — transações e SQL

- remover interpolação;
- transação em ticket/mensagem/contadores;
- Socket.IO somente afterCommit;
- revisar índices com EXPLAIN;
- migrations reversíveis.

### REL-007 — observabilidade

- request/trace/release ID;
- SLI de login, ticket, mensagem e WhatsApp;
- logs estruturados e sanitizados;
- health/readiness;
- alertas por impacto.

### REL-008 — mídia

- MIME por magic bytes;
- tamanho por tenant;
- streaming;
- nomes aleatórios;
- path traversal;
- limpeza;
- atualização controlada do Multer.

## P2 — migrações controladas

### REL-009 — laboratório Baileys 7

- branch/adapter separado;
- migração LID e auth state;
- ESM/protobuf;
- replay e soak;
- sessão canário;
- rollback para 6.7.22.

### REL-010 — dependências

- inventário por alcance;
- corrigir uma família por lote;
- teste de contrato e runtime;
- nunca usar atualização forçada em bloco.

## Regra de priorização

Se houver falha P0, congelar redesign e novas funcionalidades afetadas até existir correção, regressão automatizada e evidência pós-deploy.
