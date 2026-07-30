# Changelog

Todas as alterações relevantes deste projeto são documentadas aqui.

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
