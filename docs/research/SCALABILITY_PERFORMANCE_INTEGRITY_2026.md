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

## Decisão para 1.15 — fence dentro do commit de domínio

Fontes primárias consultadas:

- PostgreSQL 17, explicit locking: `SELECT FOR UPDATE` bloqueia updates e locks
  concorrentes da mesma linha até o fim da transação;
- PostgreSQL, isolamento: locks explícitos são necessários quando MVCC sozinho
  não expressa a regra de negócio, e transações podem exigir retry;
- Sequelize, transactions: transações gerenciadas fazem rollback por exceção,
  queries precisam receber a transação e `afterCommit` não executa em rollback;
- Redis, distributed locks: consumidores que gravam em armazenamento devem usar
  fencing tokens, não apenas confiar no TTL do lock.

O `assertWhatsappSessionFence` anterior era uma leitura isolada: havia TOCTOU
entre validar o fence e gravar Message/Ticket. A solução escolhida é bloquear a
linha `Whatsapps` por `id + companyId + sessionFence` dentro da mesma transação
que altera Ticket e Message. A aquisição de um fence novo atualiza essa mesma
linha e portanto espera o commit atual; depois do takeover, o owner antigo não
encontra a combinação anterior e falha fechado.

Downloads, Baileys e transcodificação permanecem fora da transação. Manter I/O
externo sob row lock aumentaria contenção, uso do pool e risco de timeout.
Contact e a criação inicial de Ticket serão incorporados em lote posterior,
pois hoje misturam I/O externo, filesystem e efeitos Socket.IO com persistência.

Rollback: voltar à imagem 1.14; não há alteração de schema neste lote.

## Decisão para 1.16 — criação concorrente e contador autoritativo

O schema contém `number_companyid_unique`, coerente com a identidade de Contact,
mas a constraint histórica de Ticket inclui `id`, tornando-se sempre única e
não impedindo dois tickets ativos para o mesmo contato/conexão. A base medida
possuía zero grupos duplicados, mas estava vazia para tickets; isso prova
compatibilidade atual, não ausência futura da corrida.

O PostgreSQL documenta que unicidade condicional deve ser expressa por índice
único parcial. Será criado um índice em
`companyId + contactId + whatsappId WHERE status IN (...)`, exatamente o
predicado usado pelo serviço para procurar tickets ativos. A migration abortará
antes do DDL se existirem duplicidades.

O contador anterior fazia `Redis GET`, soma em JavaScript e `SET`. Esse
read-modify-write perde incrementos concorrentes e transforma cache em fonte de
verdade. A decisão é usar incremento atômico do Ticket sob row lock; Redis
recebe apenas o valor confirmado após commit para compatibilidade temporária.

`findOrCreate` depende de constraint única para resolver a corrida entre busca
e insert. Contact declara no modelo a mesma composição do banco. O fence da
linha Whatsapp serializa os commits de uma conexão entre owners, enquanto os
índices protegem invariantes contra outros caminhos da aplicação.

## Decisão para 1.17 — identidade da API e contabilização

OWASP API1 exige autorização em cada função que recebe um identificador de
objeto; comparar apenas um ID informado pelo cliente não basta. OWASP REST
recomenda controle em todos os endpoints, HTTPS, revogação e rate limiting de
API keys. RFC 6750 define o esquema `Authorization: Bearer`.

O middleware atual valida o token, mas descarta a identidade. Cada controller
repete a consulta e um deles aceita `whatsappId` do corpo, chegando a
`findByPk` sem `companyId`. A decisão é transformar o middleware na fonte única
do contexto `{whatsappId, companyId, channel}`, negar por padrão e proibir
override pelo payload.

Há uma credencial não vazia em produção, com 30 caracteres e formato compatível
com Bearer; não há duplicidade. Será criado índice único parcial para tokens não
vazios, fechando a corrida que a validação Yup não cobre. O valor não foi lido
nem registrado.

`ApiUsages` também não possui unicidade e faz read-modify-write dentro de
`setTimeout`. Será adotado `INSERT ... ON CONFLICT DO UPDATE`, com índice único
parcial em `companyId + dateUsed`, agregando incrementos em uma query aguardada.

Armazenamento em hash é desejável porque API keys são credenciais, mas alterar
o token existente sem mecanismo de rotação quebraria clientes. Esta etapa
preserva compatibilidade e fecha BOLA/concorrência; digest + prefixo + rotação
dual será projetado separadamente.

## Como o sistema ainda pode falhar

- pool correto não resolve queries lentas nem transações longas;
- readiness pode retirar todas as réplicas se uma dependência comum falhar;
- cache sem invalidação pode aumentar velocidade servindo dado errado;
- eviction no Redis compartilhado pode remover credenciais ou leases;
- índice especulativo pode piorar ingestão de mensagens;
- lease sem CAS dentro da transação de domínio ainda permite escrita obsoleta;
- uma única instância PostgreSQL/Redis continua sendo ponto único de falha;
- métricas sem SLO e alerta não reduzem tempo de detecção.

## Decisão para 1.18 — rate limiting distribuído

OWASP recomenda API key em toda chamada protegida, revogação em caso de abuso
e resposta 429 quando as solicitações chegam rápido demais. RFC 7009 reforça
revogação imediata e alerta que o próprio caminho de credenciais precisa de
proteção contra negação de serviço.

O limitador local existente para relatórios do navegador usa `Map` e diverge
entre réplicas; não serve para API externa. A documentação Redis mostra que
`INCR` seguido condicionalmente de `EXPIRE` pode vazar uma chave se houver
falha entre comandos. A decisão é executar incremento, primeiro TTL e leitura
do TTL dentro de Lua, atômico no Redis.

O middleware executa após Bearer auth e antes de Multer. A chave contém apenas
versão, `companyId` e `whatsappId`, evitando vazar credencial. Redis
indisponível retorna 503, porque permitir tráfego ilimitado justamente durante
falha ampliaria sobrecarga. Defaults são 60 chamadas/60 s, configuráveis e
limitados defensivamente.

Esta é uma medida necessária, mas não substitui digest, rotação e revogação.
Também não justifica tratar o Redis compartilhado como cache descartável:
chaves expiram e a cardinalidade é limitada a conexões ativas, enquanto a
separação entre auth/lease e dados efêmeros continua no backlog.

## Baseline para rotação/digest após 1.18

A inspeção do fluxo real impediu uma substituição direta da coluna `token`.
`WhatsAppModal` e sua variante admin geram 30 caracteres com `Math.random` no
navegador, recebem novamente o token completo ao abrir a conexão e permitem
copiá-lo. Refresh troca o único valor; não existe estado `current/previous`,
expiração, revogação ou evento de auditoria.

O storage Multer também relê `Authorization` e consulta `Whatsapp.token` para
descobrir empresa. Embora o índice global da 1.17 impeça colisão atual, esse
caminho duplica autenticação e quebraria quando a coluna plaintext fosse
removida. Ele deve consumir `req.apiConnection.companyId`, já estabelecido
antes do upload.

A migração segura será expand-and-contract:

1. adicionar credencial separada com prefixo, digest, estado e timestamps;
2. gerar segredo por `crypto.randomBytes` no backend e revelar uma vez;
3. autenticar digest novo e, temporariamente, token legado;
4. oferecer rotação dual com expiração/revogação explícita;
5. migrar clientes e medir uso do legado sem registrar o token;
6. somente depois remover exposição no GET e coluna plaintext.

O digest deverá ser HMAC-SHA-256 com pepper externo ao banco, porque os tokens
legados têm entropia incerta. A alteração exige provisionar e ensaiar o pepper;
reutilizar segredo genérico ou publicar um placeholder funcional seria uma
falsa proteção.

## Decisão executada na 1.20 — digest, rotação dual e revogação

A pesquisa confirmou quatro propriedades necessárias. O OWASP Secrets
Management recomenda ciclo de vida explícito, rotação, revogação e auditoria
sem registrar o segredo. O Node fornece `randomBytes`, HMAC e
`timingSafeEqual`; portanto não há justificativa para geração no navegador nem
comparação comum de strings. O RFC 5869 permite derivar uma subchave
domain-separated quando um pepper dedicado ainda não foi provisionado. O
PostgreSQL documenta que `SELECT ... FOR UPDATE` bloqueia escritores
concorrentes na mesma linha; combinado a uma transação gerenciada do Sequelize,
isso serializa rotate/revoke e faz rollback integral em exceção.

Fontes primárias:

- OWASP Secrets Management:
  https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- Node.js Crypto:
  https://nodejs.org/api/crypto.html
- RFC 5869:
  https://www.rfc-editor.org/rfc/rfc5869
- PostgreSQL explicit locking:
  https://www.postgresql.org/docs/17/explicit-locking.html
- Sequelize transactions:
  https://sequelize.org/docs/v6/other-topics/transactions/

O token novo contém prefixo aleatório de 64 bits e segredo de 256 bits. O banco
guarda somente prefixo e HMAC-SHA-256. O prefixo indexado reduz a consulta a um
conjunto mínimo; o HMAC é comparado com `timingSafeEqual`. O pepper preferencial
é `API_TOKEN_PEPPER` com no mínimo 32 bytes. Na instalação existente, a
configuração medida possui `MASTER_KEY` suficiente e não possui pepper
dedicado; a transição usa HKDF-SHA-256 com salt e info fixos do domínio
`api-token-pepper-v1`, sem mostrar nem duplicar o master. Se nenhum material
adequado existir, autenticação de formato novo falha fechada com 503.

Uma constraint parcial garante apenas um registro `active` sem expiração por
conexão. Rotate bloqueia a linha `Whatsapps`, transforma o atual em `grace`,
define expiração de 15 minutos e emite o novo na mesma transação. Na primeira
rotação, o token legado recebe a mesma expiração. Revoke, sob o mesmo lock,
revoga `active/grace` e invalida o legado atomicamente. O ator é persistido,
mas o segredo nunca entra na auditoria.

Gravar `lastUsedAt` sincronicamente foi recusado: converteria cada autenticação,
hoje read-only, em write, aumentando WAL, contenção, IOPS e pressão do pool.
Medição de legado deve usar contador agregado e sem token em lote posterior.
Também não foi criado cache de autenticação: lookup indexado e local é simples,
enquanto cache introduziria invalidação difícil e risco de aceitar token
revogado. Essa escolha privilegia integridade e revogação imediata.

O ensaio restaurou backup real e passou em `up → down → up`. Em produção, a
migration aditiva levou 216 ms, criou tabela, coluna e quatro índices; 30
suítes/101 testes e os dois builds passaram. A credencial legada atravessou o
middleware, e uma inválida retornou 401. Nenhum token real foi impresso,
rotacionado ou revogado.

O primeiro smoke autenticado com corpo vazio revelou que `checkNumber` usava
`.replace` antes de validar `number`, convertendo erro do cliente em TypeError
500. A borda agora aceita somente string que, após remover espaços/hífens, seja
numérica e não vazia. Sete casos automatizados passaram; em produção, o mesmo
corpo retorna 400 e token inválido retorna 401.

## Decisão executada na 1.21 — medir migração sem segredo/write extra

OWASP Logging declara access tokens como dado que normalmente não deve ser
registrado. Prometheus recomenda evitar labels de alta cardinalidade e começar
com poucas dimensões. A decisão foi transportar somente o enum
`credentialKind=legacy|digest`, nunca token, prefixo, digest ou usuário.

Criar uma escrita de telemetria no middleware duplicaria I/O e contabilizaria
tentativas que não concluíram operação. `ApiUsages` já realiza um UPSERT
atômico por request bem-sucedido; os dois contadores foram incorporados à mesma
query. Eles não entram em `UsedOnDay`, preservando o significado financeiro e
evitando dupla contagem quando uma mensagem possui várias mídias.

O relatório admin agrega por tenant e últimos 30 dias. `readyToRemoveLegacy`
somente pode ser verdadeiro quando a observação começou há pelo menos 30 dias,
houve uso digest no período, não houve uso legado e não existe token legado
ainda ativo. Essa última condição protege consumidores dormentes após rotação,
e torna o resultado atual corretamente falso.

O PostgreSQL documenta que, desde a versão 11, `ADD COLUMN` com default
constante usa metadados e não reescreve a tabela. A relação real possuía zero
linhas, zero datas inválidas e 24 KiB. Mesmo assim, backup/restore e
`up → down → up` foram executados; a migration levou 31–42 ms no restore e
92 ms em produção.

O gate passou em 33 suítes/113 testes. O endpoint autenticado retornou 200,
uma credencial legada ativa e readiness falso; nenhum segredo foi exibido. A
rotação precisa ser coordenada com o consumidor porque o novo segredo é
revelado apenas uma vez. Até isso ocorrer e a janela terminar, remover
plaintext seria incorreto.

## Decisão executada na 1.22 — medir PostgreSQL antes de otimizar

A documentação PostgreSQL exige `shared_preload_libraries` e restart para
`pg_stat_statements`. Ela também alerta que `track_planning` pode causar
penalidade perceptível sob concorrência. A configuração adotada limita 5.000
entradas, rastreia apenas top-level, desliga planning e utility, mantém save e
habilita query IDs. O host medido tem 8,32 GB e 4,49 GB disponíveis; PostgreSQL
usa `shared_buffers=128MB`, `work_mem=4MB` e 100 conexões máximas.

O relatório não é exposto por HTTP porque as métricas são globais e um admin
de tenant não deve observar outros workloads. O script local seleciona somente
query ID e contadores: nunca texto SQL, bind, token, telefone ou mensagem.
Laboratório PostgreSQL 16 comprovou create/coleta/drop com parâmetros
`top|off|off|5000`; backup restaurado passou em up/down/up.

O primeiro snapshot de produção mostrou 2/100 conexões, cache hit 99,9936%,
zero lock waiters, idle transaction, deadlocks e temp spill. O maior tempo
individual entre os top 20 foi 14,322 ms e não houve deallocation. Assim,
índice, cache ou aumento de memória neste momento não seriam sustentados por
evidência. A coleta deve abranger carga representativa antes de EXPLAIN ou DDL.

Durante a correlação, os logs exibiram `08-01-2026` para um instante de 1º de
agosto. A causa era dupla formatação: Moment gerava texto local ambíguo e
`pino-pretty` tentava traduzi-lo. A documentação Pino recomenda timestamp
ISO-8601 e processamento no transport. O logger agora usa `isoTime` em UTC e
formato UTC explícito, comprovado por teste e runtime.

Contrato restante: medir uso legado sem guardar identificador sensível,
rotacionar o cliente em janela controlada e, após ausência comprovada de uso,
remover o fallback e a coluna plaintext. As 77 vulnerabilidades reportadas no
runtime backend, 105 no frontend e o bundle gzip de 1,68 MB permanecem riscos
reais, mas exigem inventário de caminhos alcançáveis, upgrades segmentados e
rollback próprio; `npm audit fix --force` não é uma correção segura.

## Decisão executada na 1.23 — composição única de rotas Express

A documentação oficial do Express estabelece que middleware é executado na
ordem de montagem e que `router.use()` sem path usa `/`. Assim, montar o mesmo
router duas vezes mantém duas camadas sequenciais: respostas encerradas no
primeiro handler mascaram a duplicata, enquanto caminhos sem correspondência
atravessam ambas. A mesma semântica fazia `webHookRoutes`, cujo filho atende
GET/POST `/`, transformar a raiz da API em callback social.

O inventário encontrou uso interno somente de `/webhook` e dos caminhos
canônicos de mensagens. A base tinha zero canais Facebook/Instagram e não
mostrou evento social desde o deploy anterior. Em runtime, antes da correção,
token inválido retornava 403 em `/` e `/webhook`; depois, a raiz retornou 404 e
o canônico continuou 403. Isso prova a necessidade e a compatibilidade sem
depender de hipótese de performance.

Foi removido um mount duplicado de mensagens e o alias raiz, preservando
`/webhook`. Um teste de contrato lê a composição central e exige exatamente um
mount de cada caminho, evitando regressão silenciosa. O gate passou em 36
suítes/118 testes e builds de produção. Não houve migration, cache ou tuning de
banco: nenhum desses mecanismos participa da causa.

Fontes primárias:

- https://expressjs.com/en/guide/using-middleware.html
- https://expressjs.com/en/4x/guide/writing-middleware/
- https://expressjs.com/en/5x/api/router/

## Decisão executada na 1.24 — Axios por evidência e budgets externos

O audit do grafo de produção encontrou Axios 1.7.7 diretamente alcançável em
nove arquivos e afetado por uma família de SSRF, prototype pollution, header
injection e DoS. O inventário também encontrou downloads sem timeout/limite e
Typebot com `maxBodyLength: Infinity`. A documentação oficial alerta que os
limites contra decompression bomb são opt-in, portanto apenas trocar a versão
não fecharia o risco operacional.

A cadeia de suprimentos exigiu cuidado adicional: Axios documentou o
comprometimento das versões 1.14.1 e 0.30.4 em março de 2026. Foi escolhido
1.18.0, já fora da janela vulnerável do audit e sem seguir `latest`. O commit
`2d06f96e8602c2db13b65a26340ee4a1bbc0b61f` coincide entre npm e a tag Git;
integridade do lock, 1.376 assinaturas de registro, 19 attestations e SLSA
provenance foram verificados.

JSON, mídia e upload agora têm budgets distintos: timeout 15/30/60 s, resposta
5/25/5 MiB, corpo 5/5/32 MiB e três redirects. O objetivo é backpressure e
limite de memória sem impedir áudio de até aproximadamente 25 MiB mais overhead.
Authorization e parâmetros de token são redigidos na serialização de erro; os
tokens Meta deixaram de compor URLs. Um contrato varre o backend e falha se
Axios for instanciado fora da composição ou se Infinity reaparecer.

O audit runtime caiu de 77 para 75 achados e Axios/`follow-redirects` corrigidos
sumiram. Os 8 críticos restantes não pertencem a este lote. PostgreSQL medido
em paralelo manteve 99,9951% de cache hit, zero locks/deadlocks/temp spill e
2/100 conexões; não há relação causal que justifique tuning ou novo cache.

Fatos: versões, hashes, audits, budgets, testes e runtime acima foram medidos.
Inferência: os budgets devem cobrir os payloads normais pelas APIs conhecidas.
Não testado: contas reais Mercado Pago/Meta/Typebot/transcrição e defesa completa
contra SSRF/DNS rebinding em URLs configuráveis.

Fontes primárias:

- https://github.com/axios/axios/releases
- https://github.com/axios/axios/blob/v1.x/CHANGELOG.md
- https://github.com/axios/axios/security/advisories
- https://github.com/axios/axios/issues/10636
- https://docs.npmjs.com/cli/commands/npm-audit

## Decisão executada na 1.25 — SSRF e DNS rebinding no egress

A OWASP recomenda validar cada resposta A/AAAA e desabilitar redirects para
entradas controláveis. Só validar a URL antes da conexão deixaria uma janela de
DNS rebinding: por isso o lookup do Agent classifica todas as respostas e passa
o endereço já aprovado diretamente ao socket. A política aceita apenas
HTTP/HTTPS público, sem credenciais, e nega os registros especiais oficiais da
IANA, inclusive IPv4 normalizado e IPv4 mapeado em IPv6.

Os clientes restritos desabilitam proxy, redirect e socket path. Agents
compartilhados usam keep-alive com máximo de 32 sockets e 4 livres por
protocolo, reduzindo churn sem permitir crescimento sem limite. Um teste real
detectou que Node 20 solicita `lookup(..., {all:true})`; o contrato foi corrigido
para devolver o array completo já validado antes do rollout.

Baseline: zero integrações Typebot configuradas na base observada, portanto não
há dependência conhecida de rede privada. A métrica PostgreSQL permanece com
99,9951% de cache hit, 2/100 conexões e zero locks/deadlocks/temp spill; SSRF
não é problema de query, logo índice, cache ou tuning de banco seriam mudanças
sem causa demonstrada.

Fatos: 38 suítes/157 testes, builds, API 1.25, smoke e bloqueio induzido de
metadata foram aprovados. O log contém apenas código e classe de segurança.
Inferência: 32 sockets por protocolo são suficientes para a carga atual, que
ainda não possui Typebot configurado. Não testado: contas reais Meta, Typebot e
WhatsApp; firewall de egress segue como defesa operacional complementar.

Fontes primárias:

- https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- https://owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs
- https://nodejs.org/api/dns.html
- https://nodejs.org/api/http.html
- https://nodejs.org/api/net.html
- https://github.com/axios/axios
- https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
- https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml

## Decisão executada na 1.26 — falha, retenção e shutdown Bull

Bull 3.29.3 documenta entrega at-least-once: perda do lock transforma o job em
stalled e permite nova execução. Portanto retry e `jobId` não provam exatamente
uma vez; efeitos externos ainda precisam chave idempotente ou outbox/inbox. O
contrato do processor também é explícito: rejeição/throw marca falha. Os dois
handlers ACK/mensagem violavam esse contrato ao capturar toda exceção e retornar
sucesso, descartando a única oportunidade de retry/DLQ.

O baseline agregado encontrou seis filas sem waiting/active/failed/completed e
quatro repeat jobs delayed. Redis usava 2,31 MiB, AOF yes/everysec,
`noeviction` e nenhum maxmemory. Foram adotados limites simultâneos de idade e
contagem: completed 1 h/100, failed 7 dias/500 por fila. Isso mantém diagnóstico
sem crescimento ilimitado; não foi adicionado retry automático a campanhas ou
agendamentos porque seus efeitos ainda não são comprovadamente idempotentes.

Telemetria de failed/stalled/error inclui somente fila, tipo, presença de ID e tentativas;
`job.data`, corpo de mensagem, tenant, token e texto do erro ficam fora. O
rollout dessa telemetria revelou duas filas ACK tentando conectar a URL vazia a
cada 20 segundos. A correção não instancia clientes quando ACK está desativado
e mantém falha explícita se um produtor violar a configuração.

O shutdown agora chama a API oficial `Queue#close()` em instâncias únicas. Em
produção, seis filas fecharam em 538 ms sem falha; as filas ACK desabilitadas
fecharam zero instâncias. Um job diagnóstico sem dados reais chegou a failed,
emitiu somente metadados seguros e foi removido.

Fatos: baseline, configuração Redis, 40 suítes/168 testes, 4/14 testes finais,
builds, API 1.26, smoke, DLQ e restart acima foram medidos. Inferência: os
limites atendem a carga atual vazia e precisam alerta antes de saturar. Não
testado: efeitos reais WhatsApp/campanha/agendamento, crash entre efeito externo
e commit, AOF recovery e escala multiworker.

Fontes primárias e casos upstream:

- https://github.com/OptimalBits/bull
- https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md
- https://github.com/OptimalBits/bull/blob/develop/PATTERNS.md
- https://github.com/OptimalBits/bull/issues/1828
- https://github.com/OptimalBits/bull/issues/1447
- https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- https://redis.io/docs/latest/develop/reference/eviction/

## Decisão executada na 1.27 — claim Schedule, não “exactly once” fictício

O scanner de Schedule lia uma janela `[agora, agora+30s]`, portanto ignorava
atrasados; usava `map(async)` sem await; atualizava AGENDADA antes de um enqueue
não transacional; e persistia no Redis o snapshot inteiro com mensagem e
contato. O consumer aceitava esse snapshot sem companyId/chave/status no banco.

Outbox não fecha sozinho o último dual write: a literatura registra que o relay
pode publicar duas vezes e exige consumer idempotente. Bull também é
at-least-once. O Baileys 6.7.22 instalado aceita `messageId`, mas nem o projeto
nem WhatsApp documentam que repetir o ID deduplica o efeito no servidor. Logo a
1.27 não anuncia exactly-once: ela impede concorrência automática e deixa crash
após PROCESSANDO visível para reconciliação, sem reenvio cego.

Um CTE único seleciona overdue/PENDENTE ou AGENDADA órfã, ordena por sendAt/id,
limita 100 (máximo 500), usa `FOR UPDATE SKIP LOCKED`, grava UUID/claimedAt e
retorna somente id/companyId/chave. PostgreSQL recomenda SKIP LOCKED justamente
para tabelas tipo fila; `UPDATE RETURNING` prova o conjunto alterado. Falha de
enqueue faz compare-and-set reverso apenas no mesmo tenant/chave/status.

O consumer muda AGENDADA→PROCESSANDO atomicamente por id/companyId/UUID/status.
Só o vencedor carrega associações e chama WhatsApp; duplicata/stale sai antes.
Sucesso limpa o claim para recorrência, falha vira ERRO. `companyId` tornou-se
NOT NULL após precheck fail-closed. Índices parciais correspondem exatamente a
due scan, recovery scan e unicidade UUID; nenhum cache/pool foi alterado.

Baseline: zero Schedules, 24 KiB, somente PK/companyId. Backup 0600 SHA-256
`b3ad617f013ae401c7424c2ef4328b82aa7d2a69c8440a81cc0ceba3813e56fc`.
Restore passou em up/down/up (38–66 ms). Quatro claimers PG16 dividiram 20
linhas em 7/7/6/0, 20 IDs/UUIDs únicos; CAS iniciou só 1/2. Produção aplicou em
170 ms e repetiu CAS 1/2 sem envio externo; dado sintético foi removido.

Fatos: baseline, backup/hash, DDL, concorrência, 46 suítes/178 testes, builds,
API 1.27, smoke e restart foram medidos. Inferência: batch 100 é conservador
para a carga atual nula e deve ser revisto por atraso/saturação. Não testado:
canal WhatsApp real, mídia, recorrência, crash pós-send e reconciliação visual.

Fontes primárias e padrão:

- https://github.com/OptimalBits/bull
- https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md
- https://microservices.io/patterns/data/transactional-outbox.html
- https://microservices.io/patterns/communication-style/idempotent-consumer.html
- https://www.postgresql.org/docs/16/sql-select.html
- https://www.postgresql.org/docs/16/sql-update.html
- https://www.postgresql.org/docs/16/explicit-locking.html
- https://github.com/WhiskeySockets/Baileys
- https://baileys.wiki/docs/socket/handling-messages/

## Decisão executada na 1.28 — campanha em fases persistidas

O fluxo legado de campanha fazia `findOrCreate(campaignId,contactId)` sem
constraint, não armazenava companyId, aceitava jobs por PK, engolia exceções e
marcava `deliveredAt` até mesmo depois de pedir confirmação. A resposta do
cliente então reenfileirava outra execução sem chave estável. Cancelamento e
rotas de show/update/delete/media também buscavam apenas por ID.

Bull documenta estratégia at-least-once: perda do lock ou stall pode executar
o mesmo job novamente. PostgreSQL documenta que `UPDATE RETURNING` retorna o
conjunto realmente alterado e que `SKIP LOCKED` é apropriado para múltiplos
consumidores de tabelas tipo fila. O padrão outbox ainda pode publicar duas
vezes e exige consumer idempotente. Não foi encontrada garantia upstream do
Baileys/WhatsApp de dedupe no servidor ao repetir um message ID. Portanto, a
mudança assegura exclusão automática, não exactly-once externo.

Cada recipient possui owner, FK composta para Campaign, unicidade por
tenant/campanha/contato e estados `PENDING`, `PROCESSING`,
`AWAITING_CONFIRMATION`, `DONE`, `ERROR` e `CANCELLED` protegidos por CHECK. A
fase PENDING carrega UUID persistida;
o job Bull usa `campaign:<UUID>` e apenas id/campaignId/companyId/chave. Um CAS
exato PENDING→PROCESSING vence antes de carregar contato. Confirmação usa CTE,
row lock/`SKIP LOCKED` e nova UUID para a fase de conteúdo. Scanner bounded
100/máximo 500 recupera PENDING cujo enqueue se perdeu.

Falha do handler grava ERROR e rejeita o job. Crash depois de PROCESSING não é
resetado automaticamente, pois o efeito WhatsApp pode ter ocorrido. Restart
manual gera uma chave nova somente para ERROR. Áudio ainda pode produzir texto
e mídia na mesma fase; crash intermediário continua explicitamente ambíguo.
Cancelamento persiste CANCELLED antes de remover jobs do Redis, fechando a
janela em que o scanner poderia recriar o efeito.

A revisão de escala encontrou o job por destinatário recarregando a lista
inteira tanto na preparação quanto no envio, comportamento O(N²) em dados
transferidos/instanciados. Agora apenas ProcessCampaign expande a lista uma
vez; PrepareContact e DispatchCampaign carregam Campaign/owner leves e um
contato exato. Create/update também validam ContactList, Whatsapp, User e Queue
por companyId antes de persistir referência, impedindo associação cross-tenant.

Baseline medido: zero campanhas/envios e CampaignShipping 24 KiB, sem evidência
para cache, pool ou tuning. Backup 0600 de 214.332 bytes, SHA-256
`67a1a7aedd17decb2eaef0b23542996dd727e1e4eba7a40a2bea39e45f41e3e2`.
Restore PG16 e cadeia final das três migrations passaram em up/down/up em
232/162/255 ms. Dois executores
concorrentes produziram 1/0 e duas confirmações simultâneas também 1/0.

O gate aprovou 52 suítes/197 testes e builds. Produção migrou estado/FK/índice
em 162/51/57 ms; prova
transacional com rollback repetiu início 1/0 e confirmação 1/0, sem persistir
dado sintético. API 1.28, smoke e restart em 557 ms passaram.

A auditoria pós-deploy encontrou a FK histórica de contactId com `SET NULL`
incompatível com o novo `NOT NULL`. Uma migration complementar a tornou
`ON UPDATE/DELETE CASCADE`; laboratório deletou o contato e confirmou zero
shipping órfão, com rollback. Produção confirmou a definição e zero linhas.
O índice inicial também foi auditado: `companyId` liderava embora o scanner
global não filtre tenant. A definição final ordena por `updatedAt,id`, inclui
companyId/campaignId/dispatchKey e mantém o predicado PENDING; laboratório e
produção confirmaram exatamente essa definição.

Fontes primárias e padrões consultados:

- https://docs.bullmq.io/bull/important-notes
- https://www.postgresql.org/docs/16/sql-select.html
- https://www.postgresql.org/docs/16/sql-update.html
- https://www.postgresql.org/docs/16/dml-returning.html
- https://www.postgresql.org/docs/16/explicit-locking.html
- https://microservices.io/patterns/data/transactional-outbox.html
- https://microservices.io/patterns/communication-style/idempotent-consumer.html
- https://github.com/WhiskeySockets/Baileys
- https://baileys.wiki/docs/socket/handling-messages/

Fatos: baseline, DDL, restore, concorrência e testes focados foram medidos.
Inferência: lote 100 é conservador para a carga atual nula e deve ser revisto
por lag/p95 antes de aumentar. Não testado: conta WhatsApp real, crash pós-send,
áudio em duas chamadas e reconciliação humana.
