# Pesquisa — escalabilidade, desempenho e integridade em produção

Data-base: 2026-07-29  
Estado: programa contínuo; decisões precisam de baseline e validação

## Princípio

Escala não será tratada como “adicionar cache” ou “criar índices”. Cada mudança
precisa demonstrar o gargalo, preservar integridade multiempresa e declarar
comportamento sob falha. A ordem é medir, corrigir multiplicadores de custo,
otimizar o caminho comprovado e repetir a medição.

## Fontes primárias

### PostgreSQL

- `pg_stat_statements` registra custo de planejamento e execução por query e é
  a base para priorizar SQL real:
  <https://www.postgresql.org/docs/current/pgstatstatements.html>
- estatísticas de tabelas, índices, I/O, locks e atividade são a base da
  observação operacional:
  <https://www.postgresql.org/docs/current/monitoring.html>
- índices aceleram leitura, mas têm custo de escrita e armazenamento; sua
  composição deve seguir os predicados reais:
  <https://www.postgresql.org/docs/current/indexes.html>
- `VACUUM`/`ANALYZE` preservam espaço reutilizável, visibility map e
  estatísticas do planner; `VACUUM FULL` bloqueia e não é rotina:
  <https://www.postgresql.org/docs/current/routine-vacuuming.html>
- row locks duram até o fim da transação e devem ser usados com ordem
  consistente para evitar contenção/deadlock:
  <https://www.postgresql.org/docs/16/explicit-locking.html>
- timeouts de statement, lock e transação ociosa devem ser aplicados por
  workload/conexão, não globalmente sem análise:
  <https://www.postgresql.org/docs/17/runtime-config-client.html>

### Sequelize

- produção deve usar transações explicitamente; Sequelize não as aplica por
  padrão:
  <https://sequelize.org/docs/v6/other-topics/transactions/>
- cada instância Sequelize possui seu próprio pool; em múltiplos processos o
  orçamento deve ser dividido entre instâncias:
  <https://sequelize.org/docs/v6/other-topics/connection-pool/>

### Redis

- `maxmemory` e eviction precisam refletir se o dado é descartável; misturar
  cache com estado persistente favorece separar instâncias:
  <https://redis.io/docs/latest/develop/reference/eviction/>
- pipelining reduz RTT e aumenta throughput, mas batches ilimitados acumulam
  respostas na memória:
  <https://redis.io/docs/latest/develop/using-commands/pipelining/>
- `KEYS` é causa conhecida de latência e não deve ser usado em produção:
  <https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/>
- hit/miss, evictions, latency monitor e slowlog devem orientar o cache:
  <https://redis.io/docs/latest/commands/info/> e
  <https://redis.io/docs/latest/commands/slowlog/>
- cache local exige invalidação e flush ao perder a conexão; sem isso pode
  servir dados obsoletos:
  <https://redis.io/docs/latest/develop/reference/client-side-caching/>

### Runtime e operação

- event-loop bloqueado reduz throughput de todos os clientes Node:
  <https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop>
- `monitorEventLoopDelay` fornece histograma para medir a saturação:
  <https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions>
- liveness deve indicar processo vivo; readiness deve retirar tráfego sem
  provocar restart em cascata quando dependências falham:
  <https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/>

## Baseline observado

Medição read-only em 2026-07-29:

- PostgreSQL 16: `max_connections=100`, 12 conexões abertas e 1 ativa;
- ambiente: `DB_POOL_MAX=20`, `DB_POOL_MIN=2`, idle de 600 s;
- apenas uma empresa e tabelas de negócio praticamente vazias;
- dois serviços criavam novas instâncias Sequelize, portanto dois pools extras;
- defaults do código permitiam 100 conexões e mínimo 15 por instância;
- apenas quatro ocorrências de transação explícita nos serviços/controllers;
- havia SQL interpolado em relatórios de mensagens;
- Redis contém auth state e leases, logo não é cache puramente descartável;
- Redis usa AOF; política de memória/eviction ainda não foi deliberadamente
  configurada;
- o projeto não possuía healthcheck de backend/frontend;
- o banco atual é pequeno demais para justificar novos índices por estatística.

Refinamento pós-rollout:

- das 12 entradas iniciais, 5 eram processos internos e 1 era a sessão de
  medição; 6 eram conexões ociosas da aplicação;
- após remover pools ad hoc, mas antes de alinhar o `.env`, continuaram 6
  conexões ociosas porque o boot concorrente as abria e o idle era 600 s;
- com um pool, `min=0` e idle de 10 s, estabilizou em 1 conexão ociosa usada
  pelos healthchecks: redução observada de 83% nas conexões ociosas da aplicação.

## Decisões comprovadas para 1.12

1. Remover pools Sequelize ad hoc e usar a instância compartilhada.
   Necessidade: cada réplica multiplicaria até três pools; com default antigo,
   uma réplica poderia exceder sozinha as 100 conexões do PostgreSQL.
2. Reduzir defaults para `max=20`, `min=0`, idle 10 s.
   O ambiente pode sobrescrever, mas o default deixa de ser inseguro.
3. Remover SQL interpolado dos relatórios e validar tenant/datas.
   Corrige simultaneamente injeção, plano reutilizável e integridade.
4. Separar `/health/live` de `/health/ready`; readiness verifica PostgreSQL,
   Redis e drain com timeout curto.
5. Remover a API `KEYS` não utilizada do wrapper de cache.
6. Não criar índices compostos ainda. Ativar medição de queries reais primeiro.
7. Não habilitar eviction no Redis atual sem separar cache descartável de
   credenciais/leases; eviction desses dados violaria disponibilidade e
   integridade.

## Descoberta e decisão para 1.13

Baseline read-only da tabela `Messages`:

- zero grupos duplicados por `companyId + wid`;
- `idx_messages_wid` não era único;
- `CreateMessageService` chamava `upsert`, mas o modelo/banco não declaravam
  unicidade no identificador de mensagem por tenant; sem conflito conhecido,
  PostgreSQL poderia inserir novamente;
- `Message.upsert`, `findOne` e updates derivados não compartilhavam transação;
- Socket.IO era emitido antes de existir uma fronteira transacional explícita;
- `Messages_id_key` parecia duplicar a primary key de `id`, mas foreign keys
  legadas dependem diretamente dessa constraint;
- `idx_message_company_id` duplicava outro índice simples de `companyId`, e
  ainda existem índices compostos iniciados por `companyId`.

Decisão:

1. bloquear a migration se aparecer qualquer duplicidade, sem escolher
   automaticamente qual mensagem apagar;
2. criar unique constraint `companyId + wid`;
3. declarar o índice no modelo para o `upsert` gerar `ON CONFLICT` correto;
4. executar upsert, reload e ajustes em uma transação;
5. emitir Socket.IO somente após o commit;
6. remover somente `idx_message_company_id`, comprovadamente duplicado;
7. preservar `Messages_id_key`: o primeiro rollout mostrou dependências de
   foreign key não capturadas pela inspeção inicial.

Esta mudança é necessária por integridade e idempotência, não por conjectura de
performance. O banco vazio torna o rollout de constraint de baixo risco; em
bases maiores a criação deverá ser planejada com índice concorrente.

Regra aprendida no rollout: antes de remover uma constraint, consultar também
suas dependências em foreign keys/`pg_depend`; igualdade de definição de índice
não prova que o objeto seja substituível.

## Plano priorizado

### P0

1. Propagar o fence WhatsApp para a mesma transação das mutações de Message,
   Ticket, Contact e contadores.
2. Corrigir endpoints/API que aceitam `companyId` sem identidade tenant
   criptograficamente vinculada.
3. Testar backup/restore de PostgreSQL e Redis auth state.
4. Adicionar idempotência e outbox/afterCommit aos fluxos mensagem/ticket.

### P1

1. Habilitar `pg_stat_statements` em mudança operacional planejada e medir uma
   janela representativa antes de índices.
2. Registrar pool em uso/espera, conexões DB, locks, dead tuples, Redis
   hit/miss/evictions, event-loop p95/p99 e filas.
3. Separar Redis de estado (auth/lease, `noeviction`, persistência) de Redis de
   cache/filas antes de escala horizontal.
4. Definir timeouts por conexão/workload e limites de concorrência/backpressure.
5. Revisar queries N+1, paginação sem limite e payloads/mídia em memória.

## Decisão para 1.14

A unique constraint da 1.13 tornou explícito que `wid` não é identidade global:
ela é única somente dentro de `companyId`. A auditoria encontrou lookups ativos
de quoted message, ACK e delete usando apenas `wid`. Mesmo sem colisões atuais,
isso viola o modelo multiempresa e poderia atualizar/carregar uma mensagem de
outro tenant.

Correção: propagar `companyId` pelo callback direto e pelo payload do job e
incluí-lo em todo lookup ativo identificado. Não foi removido o índice global de
`wid` nesta etapa, pois código legado não carregado ainda será eliminado em lote
separado.

## Como o sistema ainda pode falhar

- pool correto não resolve queries lentas nem transações longas;
- readiness pode retirar todas as réplicas se uma dependência comum falhar;
- cache sem invalidação pode aumentar velocidade servindo dado errado;
- eviction no Redis compartilhado pode remover credenciais ou leases;
- índice especulativo pode piorar ingestão de mensagens;
- lease sem CAS dentro da transação de domínio ainda permite escrita obsoleta;
- uma única instância PostgreSQL/Redis continua sendo ponto único de falha;
- métricas sem SLO e alerta não reduzem tempo de detecção.
