# Changelog

Todas as alterações relevantes deste projeto são documentadas aqui.

## [1.39] — 2026-08-08 — o núcleo emaranhado aberto: 133 → 26 arquivos

| | antes | depois |
|---|---|---|
| Maior componente cíclico | 133 arquivos | **26** |
| Arquivos sem nenhum ciclo | 470 | **589** |
| Arestas subindo de camada | 9 | **0 reais** |

### Mudado

- `libs/sessionHooks.ts` (novo): `libs/wbot.ts` deixa de chamar
  `StartWhatsAppSession` e `ImportWhatsAppMessageService` diretamente e passa a
  depender de assinaturas que ele mesmo declara. `server.ts` — já o ponto de
  composição — fornece as implementações. Gancho ausente emite
  `session_hook_not_registered`: sessão que não reconecta em silêncio seria o
  pior modo de falha possível.
- `helpers/WhatsappMessageType.ts` (novo): `getTypeMessage` e `isValidMsg` saem
  de um arquivo de 5.400 linhas. São puras — sem estado, banco ou sessão.
- `libs/queue.ts` → `jobs/bullQueues.ts`: compunha filas a partir de `../jobs`,
  ou seja, infraestrutura dependendo de aplicação. Nunca foi infraestrutura.
- `helpers/SendMessage.ts` → `services/MessageServices/`, e
  `helpers/UpdateDeletedUserOpenTicketsStatus.ts` → `services/TicketServices/`:
  eram serviços na pasta errada.

### Aresta falsa

O grafo ainda reporta `libs/socket.ts -> app.ts`, que **não existe**: vem de
`ALLOWED_ORIGINS` sendo casado com `allowedOrigins` de `app.ts` por normalização
de nome. Com ela o núcleo aparenta 134; sem ela, 26. É a regra do OS na prática —
uma aresta é hipótese até ser confirmada.

### Verificado

Gate 62/237, `tsc` limpo, deploy 1.39, `/health/ready` 200 e **sessão WhatsApp
reconectada após restart**, sem nenhum `session_hook_not_registered` no log.

**Não exercitado:** reconexão por queda real de conexão — forçar isso em produção
com tráfego não é aceitável. O caminho de boot foi provado e usa o mesmo registro.

## [1.38] — 2026-08-08 — dois serviços deixaram de depender de um controller

Primeira ação sobre o núcleo emaranhado medido pelo grafo (HEALTH-003).

### Mudado

- `sendMessageFlow` saiu de `controllers/MessageController.ts` para
  `services/MessageServices/SendMessageFlowService.ts`. `ActionsWebhookService`
  e `DispatchWebHookService` passaram a importar de lá. Movimentação literal:
  mesmo corpo, mesma assinatura, comportamento inalterado.

### Medido, e honesto

Das 328 dependências internas do núcleo, **9 sobem de camada** — são elas que
fecham o ciclo. Este lote cortou 2. **O núcleo não diminuiu** (133 → 134): ciclo
só abre quando a última aresta de retorno cai, então cortar parte não produz
efeito visível. A melhoria é de camada, não de acoplamento.

As 7 restantes estão listadas em `docs/versions/1.38/README.md`. Três exigem
decisão de arquitetura — `libs/wbot.ts` chama `StartWhatsAppSession` e
`ImportWhatsAppMessageService` em runtime, e inverter isso muda o fluxo de
controle da sessão do WhatsApp.

## [1.37] — 2026-08-08 — a instalação nova não funcionava nos dez primeiros minutos

Origem: uso real. Três defeitos seguidos ao mandar uma mensagem para o número
conectado. Nenhum é bug de lógica — os três são **padrões de primeira
instalação** que tornam o produto inutilizável para quem acabou de instalar.

### Corrigido

- **Ticket invisível.** Mensagem recebida criava o ticket `pending` sem fila; o
  dashboard contava e a lista "Aguardando" ficava vazia. `allTicket` nasce
  `disable` e a instalação nova não tem fila, então o filtro virava
  `queueId IN ()` e não casava com nada. Agora admin e usuário sem fila
  alcançam ticket sem fila; quem tem fila continua vendo só as suas.
- **Mensagem vazia enviada ao cliente.** Aceitar o ticket disparava a saudação
  automática — ligada por padrão, com texto em branco. Saiu uma mensagem de zero
  caractere para o contato real. `MessageController.store` passa a recusar
  mensagem sem texto, mídia e vCard; o front não dispara saudação em branco; e
  `sendGreetingAccepted` nasce `disabled` em `CreateCompanyService` e nos seeds.

### Registrado, não corrigido

- Aceitar um ticket sem fila pede "Selecionar setor", e são três vínculos que
  nada indica serem necessários — fila, **conexão→fila** e usuário→fila. O que
  faltava era o segundo. Vai para o instalador.
- O mesmo cadastro se chama Filas, Setor, Setor/Fila e Departamento conforme a
  tela.

### De quebra

A mensagem caiu no contato do telefone real e não criou contato LID novo: é a
prova de produção da 1.32, que só o tráfego real poderia dar.

## [1.36] — 2026-08-08 — instalador de um comando

### Adicionado

- `instalar.sh` — quatro perguntas (domínio do painel, domínio da API, e-mail e
  senha do admin) e o resto é gerado: dez segredos criptográficos, `.env` com
  permissão 600 e um `Caddyfile` para HTTPS automático. Confere Docker,
  memória, disco e portas antes de subir.
- Verificação real ao final: versão da API, banco e Redis conectados, painel
  respondendo e **login do administrador funcionando**.

### Corrigido

- `compose.yaml` não repassava `RUN_DB_SEEDS` ao container. O entrypoint do
  backend depende dessa variável para criar empresa, plano, usuário e settings
  iniciais — sem ela a instalação terminava com o banco **vazio** e ninguém
  conseguia entrar. Encontrado executando o instalador de ponta a ponta numa
  cópia isolada; o texto na tela dizia "CRM instalado".

Este defeito é a razão de o instalador terminar tentando um login de verdade em
vez de conferir apenas se o serviço respondeu.

## [1.35] — 2026-08-07 — implantada e verificada

Lote voltado a preparar o produto para ser **vendido como código-fonte** e
instalado por terceiros.

### Corrigido — planos não limitavam nada

- As dez flags de funcionalidade do plano (`useCampaigns`, `useSchedules`,
  `useInternalChat`, `useIntegrations`…) existiam na tabela e **nenhuma rota as
  consultava**. Comprovado: empresa num plano com `useCampaigns: false` criou
  campanha com HTTP 200. Só `users` e `connections` tinham limite real.
- `middleware/requirePlanFeature.ts` aplicado em 44 rotas (campanhas, listas de
  contato, itens de lista, agendamentos, chat interno, integrações), com
  mensagem que o usuário final entende e falha fechado quando o plano não
  resolve.
- Consequência para quem revende: agora é possível vender planos diferenciados.
  Antes, o cliente do plano barato alcançava tudo pela API.

### Corrigido — instalação de terceiro nascia insegura

- Cada segredo tinha valor embutido: `JWT_SECRET || "mysecret"`,
  `JWT_REFRESH_SECRET || "myanothersecret"`, `REDIS_SECRET_KEY || "MULTI100"`,
  `ADMIN_PASSWORD || "change-before-production"`, `VERIFY_TOKEN || "whaticket"`.
  Esquecer o segredo do JWT não gerava falha visível — a aplicação subia e
  qualquer pessoa que conhecesse o padrão público forjava token de qualquer
  empresa.
- `config/requiredSecrets.ts` aborta o boot com mensagem que ensina a resolver.
  Valores embutidos removidos de `config/auth.ts` e `config/redis.ts`.

### Adicionado

- `LICENSE` — MIT, preservando o copyright do Whaticket (`canove`, 2020) e
  registrando o trabalho derivado. A MIT autoriza a venda, mas **exige** o aviso
  preservado; sem o arquivo, a licença que dá o direito de vender era a que
  estava sendo descumprida.

## [1.34] — 2026-08-07 — implantada e verificada

### Corrigido — P0, isolamento multiempresa (SEC-001)

Primeiro teste real com **duas empresas**: uma tentando ler, alterar e apagar os
dados da outra. Leitura estava protegida em 20 superfícies; escrita e exclusão
não estavam.

- `DELETE /tickets/:id` apagava o ticket de outra empresa **e o histórico de
  mensagens por cascata**. `DeleteTicketService` recebia `companyId` e não o
  usava; no controller havia uma verificação de tenant comentada.
- `quick-messages` e `contact-lists`: leitura, alteração e exclusão de registro
  de outra empresa por ID.
- Escopo de tenant aplicado na consulta em `TicketServices`, `QuickMessage`,
  `ContactList`, `ContactListItem`, `Tag`, `Chat`, `QueueOption` (via `Queue`) e
  `ScheduledMessages`.

### Regressão

- Quarta asserção em `tenantAuthContract.spec.ts`: todo `ShowService`,
  `UpdateService` e `DeleteService` precisa mencionar `companyId`, com exceção
  declarada para conteúdo de plataforma.
- `isolamento-completo.sh`: ataque real entre duas empresas, com empresa-alvo
  descartável.

### Custo registrado

Provar exclusão indevida destrói o dado: o ticket 1 da produção e suas mensagens
foram perdidos durante a prova. Era dado de teste. Por isso o teste definitivo
não usa mais a empresa de produção como alvo.

## [1.33] — 2026-08-07 — implantada e verificada

### Corrigido — P0, autenticação e isolamento multiempresa

- `/dashboard/ticketsUsers` e `/dashboard/ticketsDay` estavam **sem `isAuth`**.
  Com `companyId` vindo da query, qualquer pessoa na internet lia nome dos
  usuários e volume de atendimento de qualquer empresa, sem token. Comprovado
  contra a produção antes da correção (HTTP 200 com dados reais).
- `/invoices/list` estava sem `isAuth`.
- `UserController.list` aceitava `companyId` da query: um usuário logado
  listava nome, e-mail e filas dos usuários de outra empresa.
- `/api/contacts`, `/api/contacts-count` e `/api/messagesRange` saíram do
  `COMPANY_TOKEN` global — um único segredo que permitia ler contatos e
  mensagens de qualquer empresa — e passaram a usar a credencial por empresa,
  revogável (`tokenAuth`).

### Regressão

- `src/routes/__tests__/tenantAuthContract.spec.ts` no `quality-gate.sh`: exige
  autenticação em toda rota (com lista explícita de públicas) e proíbe qualquer
  controller de ler `companyId` de `req.query`/`req.body`. Cobre a classe do
  defeito, não as quatro instâncias corrigidas.

### Não fecha

SEC-001 continua aberto: o teste negativo real entre duas empresas depende de
existir uma segunda empresa, e a produção tem uma só.

## [1.32] — 2026-08-07 — em validação de produção

### Entregue no código

- `helpers/ResolveContactJid.ts` resolve o telefone real a partir de
  `key.senderPn` / `key.participantPn` quando o remetente chega como LID;
- integrado em `getContactMessage` e `getSenderMessage`;
- `contacts.update` deixa de criar contato e só atualiza a foto de quem já
  existe no tenant, via `FindWhatsappContactByJidService`;
- `verifyRecentCampaign` e `typebotListener` resolvem o remetente antes de casar
  confirmação de campanha e antes de montar o destino `${number}@c.us`.

### Evidência atual

O problema é de produção, não hipotético: a mesma pessoa virou dois contatos com
tickets separados — `558896090796` pelo painel e `210986577449008@lid` ao
receber. A primeira correção, só do caminho da mensagem, foi implantada às 00:47
e às 06:54 a produção ainda criou `100236483629289@lid`, por outro caminho. Foi
esse terceiro registro que revelou o handler `contacts.update`, que criava
contato a partir de troca de foto de perfil com nome e número iguais aos dígitos
do JID.

16 testes aprovados nos dois specs, `tsc --noEmit` limpo, ambos incluídos no
`quality-gate.sh`.

### Limite e rollback

Não exige Baileys 7: o 6.7.22 já entrega o telefone na chave da mensagem. O que
ele não tem é armazenamento de mapeamento LID↔telefone, então os caminhos que
recebem só o JID não resolvem nada — e a decisão correta neles é não criar
identidade, não inventá-la. Sem migration de merge para os LIDs já gravados.
Grupos e `ImportContactsService` ficam fora. Rollback é a imagem anterior, sem
reversão de dados.

## [1.31] — 2026-08-03 — publicada

### Entregue no código

- substituído `request` no webhook N8N/webhook pelo cliente Axios endurecido;
- URL configurável passa por bloqueio SSRF e DNS rebinding, sem redirects/proxy;
- timeout, resposta e corpo possuem limites explícitos e conexões são reutilizadas;
- falhas assíncronas são aguardadas e propagadas, sem `throw` perdido em callback;
- removida a árvore sem suporte `request`, `form-data` 2.x e `tough-cookie` 2.x.

### Evidência atual

O caminho é ativo e recebe URL persistida por tenant. O audit runtime caiu de
72/7 críticas para 68/5; `request`, `form-data` vulnerável e `tough-cookie`
saíram integralmente. A imagem runtime reportou 67/4 críticas. Gate com 59
suítes/217 testes, builds, deploy, smoke e restart passaram; o shutdown fechou
seis filas sem falha em 542 ms e retornou sem migration pendente.

### Limite e rollback

Não há retry automático: o destino pode ter aceitado o POST antes de uma falha
de rede, portanto repetir cegamente poderia duplicar efeitos. O lote não muda
banco, cache ou filas. Rollback é a imagem 1.30.

## [1.30] — 2026-08-03 — publicada

### Entregue no código

- removido o painel dormente `bull-board` 0.5.0 e `/admin/queues`;
- removido `basic-auth` e as credenciais exclusivas da rota;
- preservadas filas, DLQ, retenção, telemetria e shutdown do Bull;
- regressão impede retorno do pacote, rota ou variáveis legadas.

### Evidência atual

Produção tinha o painel desabilitado, sem Redis ACK e sem credenciais. O audit
runtime caiu de 76 para 72 achados e de 9 para 7 críticos; `bull-board`, EJS e
React Highlight saíram do grafo sem upgrade forçado. Gate 58 suítes/214 testes
e builds passaram. Em produção a rota respondeu 404, os pacotes ficaram
ausentes da imagem, smoke 1.30 e restart com fechamento de filas passaram.

### Limite e rollback

O lote não atualiza Bull nem oferece UI substituta. Caso a inspeção visual de
filas volte a ser requisito, ela deve usar os pacotes modulares oficiais atuais,
autenticação administrativa forte e exposição de rede restrita. Rollback é a
imagem 1.29; não há migration nem mudança de dados.

## [1.29] — 2026-08-03 — publicada

### Entregue no código

- reconciliação administrativa de Schedule/CampaignShipping ambíguos;
- decisão explícita `ACKNOWLEDGE` ou `REARM`, sem retry automático;
- row lock e CAS pela UUID persistida do dispatch, isolados por tenant;
- justificativa obrigatória e auditoria na mesma transação;
- recorrência de Schedule centralizada entre worker e reconciliação;
- fechamento condicional de campanha após reconhecimento de conteúdo;
- índices parciais tenant-first e listagens bounded sem mensagem/telefone;
- interface responsiva com alerta de duplicação e histórico;
- README público, política de segurança, contribuição, templates e CI.

### Evidência atual

Backup 0600/SHA-256 e restore PostgreSQL 16 foram aprovados. O laboratório
encontrou e corrigiu uma comparação inválida de timestamp com microssegundos;
com UUID, dois reconciliadores produziram 1 sucesso/1 conflito e uma auditoria.
Migration final passou em 143/48/107 ms; gate fechou 57 suítes/212 testes e
builds. Produção migrou em 191 ms, repetiu 1/1 conflito e ficou sem sintéticos.
E2E autenticado desktop/mobile executou reconhecer→auditar sem console/page
errors; restart fechou seis filas em 542 ms e retornou saudável na versão 1.29.

### Limite

Reconhecer não prova entrega no servidor WhatsApp: é uma decisão humana após
verificação externa. Rearmar pode duplicar mensagem já entregue. O recurso não
substitui outbox nem exactly-once externo.

## [1.28] — 2026-08-03 — publicada

### Entregue

- owner e FK composta tenant/campanha em `CampaignShipping`;
- máquina de estados e CAS por UUID antes de efeitos externos;
- confirmação atômica com chave nova para a fase de conteúdo;
- recuperação bounded de `PENDING` e `jobId` estável no Bull;
- falhas propagadas, cancelamento persistente e restart manual de `ERROR`;
- endpoints e serviços de campanha corrigidos para o tenant autenticado;
- SQL interpolado removido do scanner de campanhas.
- preparação/disparo deixaram de carregar todos os contatos por destinatário;
- ContactList/Whatsapp/User/Queue são validados no tenant antes de create/update.
- índice parcial segue a ordem global real do scanner e cobre metadados do job.

### Evidência atual

Backup 0600/SHA-256 e cadeia final `up/down/up` em 232/162/255 ms. Concorrência
de execução e confirmação produziu 1/0. Gate 52 suítes/197 testes e builds
passou. Produção migrou estado/FK/índice em 162/51/57 ms; prova com rollback deu 1/0 e
1/0, API 1.28, frontend, smoke e restart em 557 ms foram aprovados. A auditoria
pós-deploy alinhou a FK obrigatória de contato de SET NULL para CASCADE.

### Limite

Não há exactly-once do WhatsApp. Crash após `PROCESSING`, inclusive entre texto
e mídia de áudio, permanece ambíguo e sem retry automático. Rollback usa a
migration `down`, imagem 1.27 e backup externo ao Git.

## [1.27] — 2026-08-03 — publicada

### Entregue

- claim PostgreSQL bounded com `FOR UPDATE SKIP LOCKED` e recuperação de órfão;
- jobId por UUID persistida e payload Redis reduzido a IDs/chave;
- compare-and-set tenant/key/status antes de carregar contato ou enviar;
- companyId NOT NULL e índices parciais para due/recovery/unicidade;
- falha de enqueue libera somente o claim exato;
- mídia agendada recebe a sessão Baileys correta;
- logs vazios do scanner rebaixados a debug.

### Evidência

Backup 0600 com SHA-256 registrado; restore `up/down/up` em 38–66 ms. Quatro
workers reclamaram 20 linhas em 7/7/6/0 sem duplicata; somente um de dois
executores iniciou. Gate 46/178 e builds passaram. Produção aplicou migration
em 170 ms; API 1.27, CAS controlado, smoke e restart em 568 ms passaram. A linha
sintética foi removida e Schedules retornou a zero.

### Limite e rollback

Não há garantia exactly-once do WhatsApp. Crash após PROCESSANDO permanece
visível e não é reenviado automaticamente. Rollback: down e imagem 1.26; backup
`pre-1.27-20260803.dump` permanece fora do Git.

## [1.26] — 2026-08-03 — publicada

### Objetivo e entregue

Fundação de confiabilidade Bull: handlers ACK/mensagem agora rejeitam falhas,
retenção completed/failed é limitada, failed/stalled/error têm telemetria sem
payload e todas as filas configuradas fecham no shutdown. Filas ACK desativadas
deixaram de criar clientes Redis inválidos em loop.

### Evidência

- baseline: seis filas sem backlog e quatro repeat jobs delayed;
- Redis: 2,31 MiB, AOF everysec e noeviction;
- gate completo 40 suítes/168 testes e ambos os builds;
- correção final 4 suítes/14 testes focados e build backend;
- API 1.26, smoke e job diagnóstico `failed` com log sanitizado;
- restart fechou seis filas sem falha em 538 ms e zero filas ACK desabilitadas.

### Dados, limites e rollback

Sem migration ou tuning. Bull continua at-least-once; idempotência/outbox por
efeito externo e Redis separado permanecem pendentes. Rollback: imagem 1.25.

## [1.25] — 2026-08-02 — publicada

### Entregue

- bloqueio de redes privadas, especiais, metadata e credenciais em URLs;
- validação fail-closed de todos os A/AAAA com o IP aprovado fixado ao socket;
- redirects, proxy e socket path desabilitados para entradas não confiáveis;
- pools compartilhados limitados e observabilidade agregada sem dados sensíveis.

### Evidência e rollback

38 suítes/157 testes, builds, API 1.25 e smoke aprovados. Loopback e metadata
foram bloqueados; destino público respondeu 200. A falha controlada em produção
registrou apenas `ERR_SSRF_BLOCKED` e a classe de segurança. Sem migration ou
mudança de banco/cache; rollback: imagem 1.24.

## [1.24] — 2026-08-02 — publicada

### Objetivo

Iniciar a redução controlada de vulnerabilidades pelo cliente HTTP alcançável,
com limites explícitos e proteção de credenciais.

### Entregue

- Axios backend fixado em 1.18.0, com tag, integridade e provenance verificadas;
- clientes distintos para JSON, download de mídia e upload;
- budgets de timeout, corpo, resposta e redirects;
- integrações Mercado Pago, Meta, Typebot, perfil e transcrição centralizadas;
- tokens Meta removidos das URLs e chaves sensíveis redigidas em `toJSON()`;
- contrato bloqueia imports Axios diretos e budgets infinitos.

### Evidência

- 1.376 assinaturas/19 attestations verificadas;
- audit runtime: 77 → 75; Axios/`follow-redirects` corrigidos ausentes;
- 37 suítes/124 testes e builds Docker aprovados;
- API 1.24, smoke e configuração runtime aprovados.

### Banco, limites e rollback

Sem migration ou mudança de cache/banco. Provedores reais sem canal/conta não
foram exercitados; SSRF/DNS rebinding de URLs configuráveis permanece parcial.
Rollback: imagem 1.23.

## [1.23] — 2026-08-01 — publicada

### Entregue

- removido o segundo mount idêntico de `messageRoutes`;
- removido o alias social acidental montado em `/`;
- preservado o único endpoint canônico `/webhook`;
- contrato automatizado impede regressão dos mounts.

### Evidência

- inventário confirmou que frontend e rotas internas usam somente caminhos
  canônicos e que não havia canal Facebook/Instagram ativo;
- 36 suítes/118 testes e builds Docker aprovados;
- API 1.23 e frontend 200 em produção;
- raiz passou de 403 para 404, `/webhook` inválido permaneceu 403 e a rota de
  mensagens permaneceu alcançável sob autenticação.

### Decisão

O alias raiz não era documentado nem consumido e ampliava a superfície pública.
A remoção não altera o contrato canônico e não requer migration.

## [1.22] — 2026-07-31 — publicada

### Entregue

- `pg_stat_statements` carregado com limite de 5.000 statements;
- coleta somente top-level, sem planning e sem utility statements;
- relatório operacional local sem texto SQL, parâmetros ou PII;
- métricas de pool, locks, cache, temp, WAL e top `queryid`;
- timestamp do logger corrigido para ISO-8601 UTC não ambíguo.

### Evidência

- laboratório PostgreSQL 16 create/coleta/drop aprovado;
- backup `0600`, restore e migration `up → down → up`;
- 34 suítes/115 testes e builds Docker aprovados;
- teste adicional do logger ISO UTC aprovado;
- migration em produção em 113 ms;
- primeiro snapshot: cache 99,9936%, 2/100 conexões, zero locks,
  idle transaction, deadlocks e temp spill; pior máximo 14,322 ms;
- API 1.22, frontend 200 e restart/shutdown em 2 ms.

### Decisão

Nenhum índice, cache ou aumento de memória foi aplicado: a primeira janela não
mostra gargalo e otimizar agora seria especulativo. A coleta continuará.

## [1.21] — 2026-07-31 — publicada

### Entregue

- telemetria diária `legacy/digest` sem armazenar segredo;
- contadores incorporados ao UPSERT de uso existente, sem write adicional;
- `UsedOnDay` preservado sem dupla contagem;
- relatório admin tenant-aware de prontidão para remover legado;
- contract bloqueado até 30 dias observados, digest usado e zero legado;
- normalização segura reutilizada nos endpoints de envio comum e imagem.

### Evidência

- backup `0600` com SHA-256 e restore real;
- migration passou em `up → down → up` em 31–42 ms no restore;
- 33 suítes/113 testes e builds Docker aprovados;
- migration em produção em 92 ms;
- endpoint admin retornou uma credencial legada ativa e readiness falso;
- API 1.21, frontend 200 e restart limpo em 2 ms.

### Limitações

- observação começa no primeiro request concluído após a publicação;
- a credencial real ainda precisa de rotação coordenada;
- contract da coluna plaintext permanece deliberadamente bloqueado.

## [1.20] — 2026-07-30 — publicada

### Entregue

- tokens novos persistidos somente como HMAC-SHA-256 com pepper;
- pepper dedicado ou subchave HKDF separada do `MASTER_KEY`;
- lookup indexado por prefixo e comparação com `timingSafeEqual`;
- rotação transacional com credencial anterior em `grace` por 15 minutos;
- revogação atômica de credenciais novas e legadas;
- metadados de owner, estado, expiração e atores de emissão/revogação;
- compatibilidade temporária com credencial plaintext existente;
- `/checkNumber` rejeita número ausente/inválido com 400, sem `TypeError`.

### Evidência

- backup `0600` com SHA-256 e restore real;
- migration aditiva passou em `up → down → up`;
- gate de 30 suítes/101 testes, mais 7 testes da correção de borda;
- migration aplicada em produção em 216 ms;
- API 1.20, schema/índices, compatibilidade legada, 400 e negativa 401 aprovados.

### Limitações

- token legado permanece válido até sua primeira rotação;
- uso legado ainda precisa ser medido antes de remover a coluna plaintext;
- rotação/revogação real não foi acionada em produção para não afetar cliente.

## [1.19] — 2026-07-30 — publicada

### Entregue

- tokens novos gerados por CSPRNG no backend;
- segredo revelado somente na criação/rotação;
- rotação admin, tenant-aware e restrita a WhatsApp;
- GET, listas, responses e sockets sem token;
- update comum não altera credencial;
- upload não relê Bearer;
- `/whatsapp/all` corrigido para filtrar tenant;
- autenticação duplicada sem rota removida.

### Evidência

- 26 suítes/90 testes e builds aprovados;
- API/frontend 1.19;
- lista, lista total e detalhe autenticados sem chave `token`;
- restart limpo em 1 ms.

### Limitações

- plaintext legado permanece somente no banco/autenticador;
- digest, rotação dual e auditoria seguem no próximo lote.

## [1.18] — 2026-07-30 — publicada

### Entregue

- rate limit distribuído por tenant/conexão autenticados;
- contador e TTL atômicos via Lua no Redis;
- execução antes de upload/mídia;
- 429 com `Retry-After` e headers de orçamento;
- falha fechada 503 quando Redis não garante o limite;
- configuração segura no `.env.example`.

### Evidência

- 22 suítes/85 testes e integração Redis 7 aprovados;
- builds, API 1.18, negativa 401 e restart aprovados;
- shutdown concluiu em 3 ms.

### Limitações

- janela fixa permite burst na fronteira;
- digest, rotação dual e revogação de tokens seguem pendentes;
- Redis compartilhado ainda deve ser separado por papel.

## [1.17] — 2026-07-29 — publicada

### Entregue

- contexto de conexão/tenant derivado exclusivamente do Bearer token;
- rejeição de `whatsappId` conflitante no payload;
- conexão sempre consultada por tenant e canal;
- tokens não vazios globalmente únicos;
- consumo diário único e incrementado por UPSERT atômico;
- validação de token aplicada em criação e atualização.

### Evidência

- backup e restore real com 57 tabelas;
- migration up/down/up aprovada e aplicada em produção em 113 ms;
- 21 suítes/81 testes e builds aprovados;
- API 1.17, negativa 401 e restart limpo aprovados.

### Limitações

- token ainda não usa digest/rotação dual;
- rate limit individual e conta canário permanecem pendentes;
- dívidas npm e bundle não mudaram.

## [1.16] — 2026-07-29 — publicada

### Entregue

- Contact WhatsApp criado/atualizado por identidade tenant-aware sob fence;
- contexto inicial de Ticket na mesma transação fenced;
- incremento atômico de `unreadMessages` no PostgreSQL;
- Redis rebaixado de fonte de verdade para espelho compatível pós-commit;
- índice único parcial para um Ticket WhatsApp ativo por
  tenant/contato/conexão;
- Socket.IO de Contact somente após commit;
- I/O remoto de perfil fora do row lock.

### Banco e recuperação

- backup binário pré-1.16 com SHA-256 registrado;
- restore real com 57 tabelas;
- migration up/down/up aprovada na restauração;
- zero duplicidades e owners inválidos antes do DDL;
- migration em produção concluída em 77 ms;
- índice e zero duplicidades confirmados após deploy.

### Testes e runtime

- 18 suítes e 62 testes aprovados;
- builds backend/frontend aprovados;
- API 1.16 e smoke aprovados antes/depois do restart;
- restart sem migration pendente;
- shutdown fechou recursos em 1 ms.

### Limitações

- conta canário e disputa real de duas instâncias continuam pendentes;
- commits de contexto e Message são fenced, mas separados;
- caminhos auxiliares ainda precisam de auditoria antes de liberar cluster;
- espera de lock ainda não possui p95/p99.

## [1.15] — 2026-07-29 — publicada

### Entregue

- validação `id + companyId + sessionFence` dentro da transação;
- row lock da conexão bloqueia takeover durante o commit corrente;
- row lock do Ticket valida tenant e conexão;
- `Ticket.lastMessage`, reabertura e Message no mesmo commit;
- Socket.IO de Message somente em `afterCommit`;
- I/O externo e mídia fora da transação;
- mutex local ineficaz removido.

### Banco e rollback

- nenhuma migration;
- rollback por imagem 1.14, sem alteração de schema.

### Evidência

- preflight aprovado;
- 14 suítes e 53 testes aprovados;
- builds backend/frontend aprovados;
- API 1.15 e smoke aprovados antes/depois do restart;
- nenhuma migration pendente;
- shutdown real fechou recursos em 3 ms.

### Limitações

- criação inicial de Contact/Ticket ainda antecede a transação fenced;
- disputa entre dois processos com sessão real aguarda conta canário;
- espera de row lock ainda não possui p95/p99;
- cluster continua bloqueado.

## [1.14] — 2026-07-29 — publicada

### Entregue

- todos os lookups ativos de Message por `wid` exigem `companyId`;
- quoted messages WhatsApp e Facebook permanecem no tenant do ticket;
- ACK direto e Bull transportam o tenant até a consulta;
- deleção não perde o escopo tenant no segundo lookup;
- regressão automatizada cobre propagação do tenant pelo job.

### Evidência

- 13 suítes e 48 testes aprovados;
- builds Docker backend/frontend aprovados;
- API 1.14 e smoke aprovados antes e depois do restart;
- nenhuma migration pendente;
- shutdown real fechou recursos em 4 ms.

### Limitações

- Ticket/Contact/fence ainda não compartilham a transação de ingestão;
- payloads de jobs ainda não possuem schema runtime uniforme;
- arquivo listener legado inativo permanece para remoção;
- frontend mantém 105 alertas npm e bundle principal comprimido de 1,68 MB.

## [1.13] — 2026-07-29 — publicada

### Entregue

- unicidade de mensagem por `companyId + wid`;
- migration bloqueia qualquer base com duplicidades;
- criação/reload/ajustes de Message em uma transação;
- Socket.IO emitido somente após commit;
- índice simples de `companyId` duplicado removido.

### Evidência

- backup binário e restore real aprovados;
- 12 suítes e 47 testes aprovados;
- migration final em 74 ms;
- zero duplicidades antes/depois;
- API 1.13, readiness e smoke aprovados.
- restart final fechou recursos em 2 ms e retornou saudável.

### Incidente

A primeira tentativa tentou remover `Messages_id_key`, mas foreign keys
legadas dependem dessa constraint. PostgreSQL recusou sem alterar o schema; o
backend entrou em restart loop até a imagem corrigida preservar a constraint.
A duração exata não foi medida. O aprendizado foi incorporado à pesquisa.

### Limitações

- Ticket/Contact ainda não compartilham a transação/fence da Message;
- existem buscas legadas por `wid` sem `companyId`;
- cluster WhatsApp continua bloqueado.

## [1.12] — 2026-07-29 — publicada

### Objetivo

Eliminar multiplicação de pools/SQL interpolado e adicionar readiness real.

### Entregue

- instância Sequelize única por processo;
- defaults e produção com `DB_POOL_MIN=0`, idle 10 s e teto 20;
- ranges/contagens de mensagens com tenant, validação e bind/ORM;
- liveness independente e readiness de PostgreSQL, Redis e drain;
- healthchecks Docker de backend/frontend;
- API `KEYS` não utilizada removida do cache;
- `.env.example` documentado, completo e sem segredos;
- governança permanente de pesquisa, escala, cache e integridade.

### Banco e cache

- nenhuma migration;
- conexões ociosas da aplicação reduziram de 6 para 1;
- Redis manteve `noeviction` porque contém credenciais e leases, não só cache.

### Testes

- 11 suítes e 44 testes aprovados;
- builds backend/frontend aprovados;
- healthchecks e smoke da API 1.12 aprovados;
- restart real fechou recursos em 2 ms e recuperou readiness/smoke;
- histórico Git sem padrões conhecidos de tokens/chaves privadas.

### Limitações

- token global da API de range ainda não representa um tenant;
- `pg_stat_statements`, métricas p95/p99 e alertas ainda pendentes;
- cluster WhatsApp segue bloqueado por CAS transacional pendente.

## [1.11] — 2026-07-29 — publicada

### Objetivo

Adicionar a fundação segura de exclusividade distribuída das sessões WhatsApp.

### Entregue

- lease Redis tenant-aware com token opaco, TTL, heartbeat e release condicional;
- fence monotônico PostgreSQL e CAS dos estados do lifecycle;
- auth state v2 escrito e removido atomicamente somente pelo owner;
- fail-closed para Redis indisponível e perda de ownership;
- serialização de start, reset, logout e exclusão;
- fechamento sem logout/purge ao perder o lease;
- guard central de `sendMessage` e `relayMessage`;
- logs críticos de lifecycle, credenciais e mídia sanitizados;
- migration aditiva de `sessionFence`.

### Testes

- 8 suítes P0, 34 testes aprovados;
- integração Redis 7 aprovou TTL, ABA e auth write atômico;
- TypeScript/backend e bundle/frontend aprovados;
- migration aplicada e estrutura confirmada sem consultar dados de clientes;
- API/frontend em 1.11 e smoke pós-deploy aprovados;
- restart real recebeu `SIGTERM`, fechou recursos em 1 ms e recuperou sem
  migration pendente.

### Limitações

- modo cluster continua bloqueado até o fence participar da mesma transação
  PostgreSQL das mutações de mensagens, tickets, contatos e contadores;
- teste canário WhatsApp real continua pendente;
- dívidas npm permanecem: backend 77 vulnerabilidades (8 críticas), frontend
  105 (4 críticas), exigindo atualizações controladas.

## [1.10] — 2026-07-29 — publicada

Commit funcional: `dde65fe`.

### Objetivo

Tornar encerramentos e reinícios do backend previsíveis e eliminar limpeza Redis bloqueante antes da futura adoção de lease/fencing distribuído.

### Entregue

- estado monotônico de shutdown (`running`, `draining`, `closed`);
- bloqueio de novas inicializações WhatsApp durante drain;
- cancelamento de reconexões e invalidação das gerações ativas;
- fechamento de sockets sem logout nem exclusão de credenciais;
- encerramento coordenado do Socket.IO;
- janela Docker de 40 segundos para shutdown;
- purge por `SCAN` + `UNLINK`, paginado e limitado;
- modo cluster inseguro bloqueado explicitamente;
- configuração de lint legada reparada para permitir medir a dívida real.

### Banco e migrations

- nenhuma migration;
- PostgreSQL e modelo Redis inalterados.

### Testes

- 22 testes automatizados aprovados;
- TypeScript/backend e bundle/frontend aprovados;
- lint dos arquivos novos aprovado;
- lint global executável, com 2.975 problemas legados registrados;
- quality gate agora executa obrigatoriamente as 6 suítes P0;
- processo Node confirmado como processo principal do container;
- restart real recebeu `SIGTERM` e concluiu o cleanup monitorado em 2 ms;
- smoke pós-restart confirmou frontend ativo e API em `1.10`.

### Limitações

- conta canário WhatsApp real, mídia e reconexão continuam pendentes;
- Bull, Sequelize, Redis e listeners especializados ainda aguardam registry
  completo de disposers;
- QA autenticado desktop/mobile e prova Socket.IO tenant A/B não foram
  repetidos neste deploy; o frontend e o contrato Socket.IO não mudaram neste
  lote e permanecem cobertos pela evidência da 1.9/1.8.

## [1.9] — 2026-07-29 — publicada

### Objetivo

Primeira fase de confiabilidade do lifecycle WhatsApp e auth state Redis.

### Entregue

- auth state v2 tenant-aware, versionado e com checksum;
- migração lazy sem apagar rollback legado;
- falha explícita para Redis indisponível, corrupção e escrita;
- single-flight e geração de sessão em processo;
- timeout de inicialização;
- logout/reset/delete com cleanup coerente;
- boot parcial resiliente;
- testes de concorrência, isolamento, persistência e corrupção.

### Banco e migrations

- nenhuma migration;
- PostgreSQL inalterado;
- Redis migra sob demanda e preserva chaves legadas.

### Testes

- 18 testes automatizados do lote e regressão aprovados;
- backend e frontend compilados em imagens de produção;
- runtime canário WhatsApp ainda pendente.

## [1.8] — 2026-07-28 — em desenvolvimento

### Objetivo

Autenticar o Socket.IO e garantir isolamento multiempresa de namespace e salas.

### Entregue

- Contrato canônico `/workspace-{companyId}`.
- JWT real e usuário verificados no handshake.
- Token enviado por `auth`, nunca pela URL.
- Entrada em ticket validada por `ticketId + companyId`.
- Salas e payloads numéricos padronizados.
- Ciclo de socket do frontend corrigido para refresh, logout e troca de identidade.
- Testes automatizados de contrato e autorização.

### Testes

- 8 de 8 testes automatizados aprovados.
- Builds de produção aprovados.
- Deploy conjunto e smoke aprovados.
- QA autenticado desktop/mobile sem falhas.
- Token real aceito apenas no próprio namespace e rejeitado no namespace estrangeiro.

## [1.7] — 2026-07-28 — em desenvolvimento

### Objetivo

Estabilizar o frontend e implantar navegação única e observabilidade de erros do navegador.

### Prioridades

- Tela branca nunca silenciosa.
- Menu único com ícones e subgrupos.
- Remoção da barra inferior mobile.
- Logs frontend seguros e correlacionáveis.

### Testes

- Em execução.

## [1.6] — 2026-07-28 — em desenvolvimento

### Objetivo

Reconstruir a experiência como um novo CRM e corrigir as regressões observadas na primeira fundação visual.

### Prioridades

- Scroll e viewport.
- Ações acessíveis.
- Novo shell e arquitetura de navegação.
- Identidade e usabilidade que não reproduzam o Whaticket.

### Testes

- Preflight aprovado.
- Builds de backend e frontend aprovados.
- Deploy Docker concluído.
- Smoke aprovado com API em `1.6`.

### Entregue

- Novo shell CRM com espaços de trabalho e ferramentas contextuais.
- Navegação mobile inferior.
- Dashboard completamente reconstruído.
- Correções estruturais de scroll, viewport, modais e ações.

## [1.5] — 2026-07-28 — em desenvolvimento

### Objetivo

Implantar a identidade original Konnex Signal e iniciar a reformulação integral e responsiva do frontend.

### Direção

- Mudança de composição, navegação, hierarquia, componentes e comportamento responsivo.
- Preservação de lógica, APIs, sockets, rotas e permissões.
- Identidade documentada em ADR próprio.

### Testes

- Preflight aprovado.
- Builds de backend e frontend aprovados.
- Deploy Docker concluído.
- Smoke aprovado com API em `1.5`.
- Login inspecionado em 1440×900 e 390×844.

## [1.4] — 2026-07-28 — em desenvolvimento

### Objetivo

Instituir o sistema permanente de engenharia autônoma com Codex.

### Adicionado

- Workflow para desenvolvimento por prompts simples.
- Definição de pronto e protocolo de autoavaliação.
- Memória estruturada em `docs/project/`.
- Registro de tarefa ativa e decisões arquiteturais.
- Scripts de preflight, quality gate e smoke.
- README próprio da versão 1.4.

### Alterado

- `PROJECT_STATE.md` transformado em índice curto sem falhas antigas contraditórias.
- Regras de subagentes, loops finitos, encerramento e segurança incluídas em `AGENTS.md`.
- Versão técnica sincronizada em `1.4`.

### Testes

- Preflight e validação de shell aprovados.
- Build Docker de backend e frontend aprovado.
- Deploy isolado concluído.
- Smoke aprovado com frontend ativo e API `/version` em `1.4`.

## [1.3] — 2026-07-28 — em desenvolvimento

### Objetivo

Sincronizar a versão exibida no produto e criar documentação própria para cada subversão.

### Alterado

- Versão do frontend, backend, lockfiles e arquivo canônico atualizada para `1.3`.
- Menu lateral passa a mostrar a versão real do pacote.
- Endpoint `/version` deixa de depender de valor antigo no banco.
- Processo de snapshot passa a incluir o README da versão.

### Adicionado

- `docs/versions/1.1/README.md`.
- `docs/versions/1.2/README.md`.
- `docs/versions/1.3/README.md`.
- Regra permanente exigindo README para cada nova subversão.

### Testes

- Build TypeScript do backend aprovado.
- Build de produção do frontend aprovado, com avisos legados.
- Imagens e containers Docker recriados.
- Frontend local e público respondendo HTTP 200.
- Endpoint `/version` local e público respondendo `1.3`.

## [1.2] — 2026-07-28 — concluída

### Objetivo

Implantar governança permanente de desenvolvimento, versionamento incremental, memória e snapshots reproduzíveis.

### Adicionado

- Arquivo canônico `VERSION`.
- Instruções permanentes em `AGENTS.md`.
- Política detalhada em `docs/VERSIONING.md`.
- Script seguro `scripts/create-version-snapshot.sh`.
- Diretório externo reservado para versões em `/root/whitelabel-whaticket-versions`.
- Configuração local do Codex para novas sessões com aprovação `never`.

### Regras

- Cada lote funcional incrementa uma subversão.
- Número principal muda somente após o usuário declarar a versão pronta.
- Snapshots são criados apenas a partir de worktree limpo e commitado.
- Segredos e dados operacionais não entram nos arquivos de versão.

### Testes

- Estrutura documental criada.
- Script validado por análise de shell e será executado somente no fechamento de uma versão.

## [1.1] — 2026-07-28 — concluída como base de desenvolvimento

### Objetivo

Criar uma instalação isolada e estabelecer a primeira base segura e funcional para modernização.

### Adicionado

- Docker Compose isolado com PostgreSQL, Redis, backend e frontend.
- Publicação em `whitelabel.usekonnex.com`.
- HTTPS e proxy Nginx.
- Repositório Git e documentação persistente.
- Política formal de versões e snapshots.

### Alterado

- Baileys migrado do fork 6.7.5 para o pacote oficial 6.7.22.
- Descoberta dinâmica da versão WhatsApp Web.
- Reconexão com backoff e limite.
- Endpoint de início da sessão responde quando o QR fica disponível.
- Build Docker otimizado.
- Seeds deixaram de executar a cada reinício.

### Segurança

- Removido código destrutivo e telemetria externa desconhecida.
- Removidas consultas SQL interpoladas em configurações e mensagens.
- Exclusão e duplicação de FlowBuilder passaram a respeitar `companyId`.

### Testes

- Build TypeScript aprovado.
- Login e persistência aprovados.
- Endpoint autenticado do FlowBuilder aprovado.
- Geração do QR aprovada em menos de um segundo.

### Pendente

- Escanear QR e validar conexão completa.
- Validar envio, recebimento, mídias e reconexão.
- Ampliar isolamento multiempresa.
- Criar suíte automatizada.

### Commits

- `7d7cb80` — baseline.
- `ede0dc0` — atualização do Baileys e conexão WhatsApp.
