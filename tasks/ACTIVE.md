# Tarefa ativa

## Versão 1.24 — cliente HTTP seguro e Axios verificado

Estado: publicada

### Objetivo

Remover a família de vulnerabilidades Axios alcançável no backend sem upgrade
cego e limitar tempo/corpo/resposta das integrações HTTP externas.

### Baseline

- backend resolve Axios 1.7.7 e o audit de produção atribui vulnerabilidade
  alta ao intervalo 1.0.0–1.17.0;
- nove arquivos ativos fazem chamadas HTTP; downloads de imagem/mídia e Typebot
  não possuem timeout ou limite de resposta;
- Typebot declara `maxBodyLength: Infinity` mesmo enviando JSON pequeno;
- Axios upstream declara limites de decompression/body como opt-in;
- versões 1.14.1/0.30.4 sofreram incidente de supply chain e não serão usadas.

### Critérios

- fixar versão upstream corrigida e verificar assinatura/proveniência;
- audit não pode mais atribuir advisory direto ao Axios;
- definir clientes JSON, mídia e upload com budgets explícitos;
- remover `Infinity` e impedir regressão por teste;
- preservar integrações Mercado Pago, Meta, Typebot e transcrição;
- builds, regressão, deploy, smoke, rollback e memória aprovados.

### Fora do lote

- migração ampla do Axios frontend 0.x;
- solução completa de SSRF/DNS rebinding para URLs configuráveis;
- upgrades Sequelize, Multer, Baileys ou Puppeteer.

### Resultado

- npm/Git/integridade/SLSA provenance conferem para Axios 1.18.0;
- 1.376 assinaturas e 19 attestations verificadas;
- audit runtime caiu de 77 para 75; Axios deixou de ser vulnerável;
- todas as chamadas ativas usam cliente central e tokens Meta saíram da URL;
- 6 contratos cobrem budgets, centralização e redaction real;
- gate final: 37 suítes/124 testes e builds aprovados;
- produção: API 1.24, smoke e budgets runtime aprovados;
- sem migration; rollback permanece a imagem 1.23.

## Versão 1.23 — contrato único de rotas e webhook canônico

Estado: publicada

### Critérios

- cada router de mensagens montado uma única vez;
- webhook social disponível somente em `/webhook`;
- nenhum consumidor interno depende da raiz;
- teste impede mount duplicado/alias raiz;
- canonical webhook mantém comportamento;
- raiz passa de callback 403 para 404;
- builds, regressão, deploy, smoke e restart aprovados;
- memória persistente e commit atualizados.

### Resultado

- pesquisa Express e inventário de consumidores concluídos;
- baseline runtime provou alias raiz e caminho canônico;
- zero canais sociais e nenhum evento observado;
- implementação compilada e 2 testes de contrato aprovados.
- gate completo passou em 36 suítes/118 testes e ambos os builds;
- produção publicou API 1.23 e frontend 200;
- runtime confirmou raiz 404, webhook canônico 403 com token inválido e rota de
  mensagens presente/protegida com 403;
- memória persistente e commit atualizados.

## Versão 1.22 — observabilidade PostgreSQL baseada em evidência

Estado: publicada

### Critérios

- carregar `pg_stat_statements` com configuração conservadora;
- não habilitar planning nem utility tracking;
- relatório local sem texto SQL/segredo/PII;
- medir conexões, cache, I/O, WAL, locks e top query IDs;
- laboratório PostgreSQL 16 e rollback aprovados;
- backup/restore da migration antes do restart de produção;
- gates, runtime, restart e memória persistente aprovados;
- nenhum índice novo sem janela de dados real.

### Resultado

- baseline de memória, conexões, cache, temp e locks coletado;
- pesquisa primária PostgreSQL concluída;
- laboratório create/coleta/drop e testes focados aprovados.
- backup/restore e migration up/down/up aprovados;
- 34 suítes/115 testes, logger adicional e builds aprovados;
- migration em produção em 113 ms;
- snapshot: cache 99,9936%, zero locks/temp/deadlocks, pior 14,322 ms;
- logger corrigido para ISO UTC; API/frontend e restart em 2 ms aprovados;
- nenhum índice/cache alterado sem evidência.

## Versão 1.21 — evidência para remover credencial legada

Estado: publicada

### Critérios

- distinguir legado/digest sem registrar segredo ou identificador cardinal;
- reaproveitar o UPSERT de uso, sem write adicional por request;
- preservar `UsedOnDay`;
- relatório admin escopado ao tenant;
- readiness exige 30 dias, digest ativo e nenhum legado ativo/usado;
- migration constante, aditiva, reversível e ensaiada em restore;
- corrigir `.replace` pré-validação nos demais endpoints externos;
- testes, builds, runtime, restart e memória persistente aprovados.

### Resultado

- desenho pesquisado em OWASP, Prometheus e PostgreSQL;
- base real: zero linhas/zero datas inválidas em `ApiUsages`, 24 KiB;
- implementação e 28 testes focados aprovados.
- backup/restore e migration up/down/up aprovados em 31–42 ms;
- gate completo: 33 suítes/113 testes e ambos os builds;
- migration em produção em 92 ms;
- relatório admin 200: um legado ativo e readiness falso;
- API 1.21, frontend 200 e restart em 2 ms aprovados.

## Versão 1.20 — digest, rotação dual e revogação

Estado: publicada

### Critérios

- novos segredos nunca persistem plaintext;
- autenticação digest e legado coexistem;
- lookup usa prefixo e HMAC com comparação constante;
- um único atual por conexão;
- rotação serializada mantém anterior por janela curta;
- revogação invalida todos os formatos atomicamente;
- owner, status, expiração e atores ficam auditáveis;
- migration é aditiva e passa backup/restore/up/down/up;
- nenhum valor secreto aparece em log, teste ou documentação.

### Resultado

- schema/model, crypto, autenticação dual, rotate e revoke implementados;
- HKDF permite subkey independente do master existente;
- testes focados de migration/crypto/auth/rotate/revoke aprovados.
- backup/restore e migration up/down/up aprovados;
- 30 suítes/101 testes e builds aprovados;
- produção 1.20 saudável, migration em 216 ms;
- credencial legada atravessa auth e credencial inválida retorna 401.
- número ausente/inválido em `checkNumber` retorna 400; sete testes aprovados.

## Histórico — ciclo de vida das credenciais da API

Estado: fase expand 1.19 publicada; digest em planejamento

### Baseline confirmado

- os dois modais geram 30 caracteres no navegador com `Math.random`;
- leitura da conexão devolve e reexibe o token completo;
- refresh substitui imediatamente o único token, sem período dual;
- upload externo ainda relê Authorization e consulta token fora do middleware;
- um método legado inativo no controller também contém autenticação duplicada.

### Escopo obrigatório

- gerar ao menos 256 bits por CSPRNG exclusivamente no backend;
- armazenar identificador/prefixo e digest com pepper fora do banco;
- revelar o segredo somente na criação/rotação;
- aceitar credencial anterior por janela explícita e curta;
- revogar imediatamente e auditar emissão/rotação/revogação sem gravar segredo;
- fazer upload usar somente `req.apiConnection`;
- remover caminhos mortos/duplicados antes de eliminar a coluna plaintext;
- provar compatibilidade do cliente atual e rollback antes da migration.

### Resultado da fase expand

- geração CSPRNG migrou para o backend;
- segredo sai somente em create/rotate;
- GET/list/socket/update/upload não expõem nem relêem token;
- `/whatsapp/all` passou a filtrar tenant;
- 26 suítes/90 testes, builds, runtime autenticado e restart aprovados;
- próximo lote: credencial com digest/pepper, rotação dual e auditoria.

## Versão 1.18 — rate limiting distribuído da API

Estado: publicada

### Objetivo

Proteger os endpoints externos contra abuso e custo descontrolado usando a
identidade autenticada da 1.17, sem contador local por processo.

### Critérios de aceite

- limite compartilhado entre processos por tenant/conexão;
- token nunca participa da chave Redis;
- incremento e TTL atômicos;
- execução antes do upload;
- 429 com `Retry-After` e orçamento restante;
- Redis incerto falha fechado;
- configuração inválida volta a defaults limitados;
- teste Redis 7 concorrente, regressão, builds e runtime aprovados.

### Resultado

- implementação Lua e middleware concluídos;
- 22 suítes/85 testes e builds aprovados;
- integração Redis 7 aprovou 20 incrementos concorrentes, TTL e isolamento.
- API 1.18, negativa 401 e restart aprovados; shutdown em 3 ms;
- próximo: digest, rotação dual e revogação auditável de tokens.

## Versão 1.17 — contexto autenticado e uso atômico da API

Estado: publicada

### Objetivo

Fazer o token Bearer determinar de forma única e imutável a conexão e o tenant
de cada request `/api/messages`, rejeitando IDs conflitantes do payload e
registrando consumo sem perda concorrente.

### Critérios de aceite

- middleware aceita somente `Authorization: Bearer <token>` válido;
- conexão autenticada é única no banco e anexada ao request sem o token;
- controllers não relêem Authorization nem procuram novamente pelo token;
- `companyId` nunca vem do payload e `whatsappId` divergente é rejeitado;
- toda busca de conexão inclui `id + companyId`;
- token vazio não participa da constraint;
- ApiUsages é único por empresa/data e recebe incremento atômico;
- nenhum `setTimeout` esconde falhas de contabilização;
- testes positivos/negativos tenant A/B, migration, build e runtime aprovados.

### Limites

- hash/rotação de tokens existentes exige migração de credencial compatível e
  permanece em lote posterior;
- rate limiting por credencial permanece próximo P0/P1.

### Resultado

- middleware Bearer passou a carregar o contexto autenticado;
- controllers rejeitam troca de conexão e não confiam em tenant do payload;
- índices únicos protegem token e uso diário;
- consumo é incrementado atomicamente e aguardado;
- restore/migration up-down-up, 21 suítes/81 testes, builds, deploy, negativa
  401 e restart foram aprovados;
- próximo: desenhar rotação dual/digest e rate limit por credencial, em seguida
  habilitar observabilidade SQL numa mudança operacional planejada.

## Versão 1.16 — contexto inicial WhatsApp fenced e idempotente

Estado: publicada

### Objetivo

Criar/atualizar Contact e localizar/criar Ticket sob o fence da sessão, com
unicidade real para tickets ativos e contador de não lidas atômico no banco.

### Critérios de aceite

- Contact usa a identidade `companyId + number` já protegida no PostgreSQL;
- conexão e Ticket são bloqueados dentro da transação;
- somente um Ticket ativo existe por `companyId + contactId + whatsappId`;
- incremento de não lidas é atômico no PostgreSQL;
- Redis passa a ser espelho, nunca fonte de verdade desse contador;
- chamadas Baileys, download de perfil e filesystem ficam fora do lock;
- sockets só são emitidos após commit;
- migration aborta se encontrar duplicidades, sem reconciliar dados;
- backup/restore, testes, build, deploy, smoke e restart são aprovados.

### Rollback

Imagem 1.15; o índice parcial pode permanecer por ser compatível. A remoção do
índice só deve ocorrer de forma deliberada após validar ausência de dependência.

### Resultado

- backup/restore e migration up/down/up aprovados;
- índice parcial aplicado em produção em 77 ms;
- 18 suítes/62 testes e builds aprovados;
- API 1.16, smoke e restart aprovados;
- shutdown concluiu em 1 ms;
- próximo P0: vincular autenticação dos endpoints `/api` ao tenant e eliminar
  `companyId` confiado do cliente.

## Versão 1.15 — commit Message/Ticket protegido por fence

Estado: publicada

### Objetivo

Impedir que um owner WhatsApp obsoleto confirme Message e estado do Ticket
depois que outro processo assumiu a sessão.

### Critérios de aceite

- a linha de `Whatsapp` é validada por `id + companyId + sessionFence` e
  bloqueada durante a transação;
- troca concorrente do fence não pode ultrapassar a transação em andamento;
- `Ticket.lastMessage` e Message entram no mesmo commit;
- Socket.IO da Message somente ocorre após commit;
- rede, download e transcodificação não ficam dentro do lock;
- owner ou tenant incorreto falha fechado;
- testes, build, smoke e restart são aprovados.

### Fora deste lote

- criação/atualização de Contact e criação inicial de Ticket;
- desbloqueio do modo cluster;
- conta canário WhatsApp real.

### Resultado

- preflight, 14 suítes/53 testes e builds aprovados;
- API 1.15 e smoke aprovados antes/depois do restart;
- shutdown concluiu em 3 ms;
- próximo P0: tornar criação de Contact/Ticket concorrente e fenced sem manter
  I/O externo dentro da transação.

## Versão 1.14 — lookup de Message tenant-aware

Estado: publicada

### Critérios de aceite

- nenhuma busca ativa por `wid` omite `companyId`;
- ACK mantém tenant tanto no caminho direto quanto no Bull;
- quoted messages não cruzam tenants;
- build, regressão, smoke e restart aprovados;
- limites ficam na memória persistente.

### Resultado

- 13 suítes e 48 testes aprovados;
- imagens backend/frontend compiladas;
- API 1.14 e smoke aprovados antes/depois do restart;
- shutdown real fechou recursos em 4 ms;
- próximo P0: Ticket/Contact/fence na transação de ingestão.

## Versão 1.13 — idempotência de mensagens

Estado: publicada; incidente e recuperação registrados

### Critérios de aceite

- migration aborta com duplicidade e nunca reconcilia dados automaticamente;
- `companyId + wid` é único no banco e conhecido pelo modelo;
- persistência e ajustes são transacionais;
- nenhum Socket.IO é emitido se a transação falhar;
- índices exatamente redundantes são removidos;
- build, testes, migration, smoke e rollback operacional são registrados.

### Risco residual

O fence WhatsApp ainda não alcança todas as mutações de Ticket/Contact que
envolvem a mensagem. A 1.13 fecha a idempotência da linha Message, não libera
cluster.

## Versão 1.12 — escala, pool e readiness

Estado: publicada; próximo P0 selecionado

### Objetivo

Corrigir multiplicadores comprovados de conexão/SQL e implantar sinais de saúde
adequados antes de continuar a expansão de produção.

### Critérios de aceite

- nenhum serviço cria pool Sequelize ad hoc;
- ranges usam bind parameters e rejeitam datas/tenant inválidos;
- liveness não reinicia por falha transitória de dependência;
- readiness falha fechado para drain, PostgreSQL ou Redis;
- Docker expõe health status real;
- testes induzem dependência indisponível e validação inválida;
- pesquisa, baseline, decisão, rollback e riscos ficam persistidos;
- build, smoke, restart e versão 1.12 aprovados.

### Riscos

- healthcheck mal calibrado pode criar restart loop;
- redução imediata do pool de produção sem observar workload pode elevar espera;
- endpoint legado de range usa token global e ainda requer identidade tenant
  vinculada antes de ser considerado multiempresa forte.

Estado: versão 1.11 em implementação — fundação de lease/fencing distribuído.

## Pedido atual

Continuar o programa P0 após a publicação da 1.10.

## Resultado observável esperado

- apenas um runtime pode criar o socket de uma conexão WhatsApp;
- aquisição, renovação e release do lease são atômicos e tenant-aware;
- o fence monotônico vem do PostgreSQL e não regride com perda do Redis;
- status e credenciais rejeitam owners obsoletos;
- perda ou incerteza de ownership fecha o socket sem logout/purge;
- socket obsoleto não envia novas mensagens;
- modo cluster permanece bloqueado até as mutações internas de mensagens,
  tickets e contatos também serem transacionais e fenced.

## Componentes afetados

- lifecycle Baileys e registry de sessões;
- Redis, PostgreSQL e migration aditiva;
- auth state;
- status/QR da conexão;
- shutdown e reconexão;
- testes P0 e documentação operacional.

## Riscos e fronteiras

- pausa do processo além do TTL e takeover por outro runtime;
- owner antigo retomando callbacks atrasados;
- Redis indisponível ou resposta ambígua;
- purge/logout concorrente;
- isolamento por `companyId`;
- handlers longos ainda possuem janela TOCTOU fora deste lote.

## Critérios de aceite 1.11

- sequence PostgreSQL monotônica e `sessionFence` aditivo;
- Lua compare-token para acquire/renew/release;
- CAS por `id + companyId + sessionFence` nos estados do lifecycle;
- auth writes/deletes condicionadas ao lease;
- heartbeat e perda de lease testados sem logout/purge;
- tenant A/B e owner antigo negados;
- testes, builds, migration, restart e smoke aprovados;
- rollback por imagem 1.10 preservando coluna/sequence aditivas.

## Fora deste lote

- desbloquear `server-cluster.ts`;
- garantir atomicidade fenced em todas as mutações de Message/Ticket/Contact;
- idempotência/outbox de mensagens;
- canário WhatsApp real sem conta isolada disponível;

## Pedido

Transformar a aplicação em um novo CRM, eliminando a arquitetura visual e de uso herdada do Whaticket. Corrigir imediatamente rolagem e botões que desaparecem, reconstruir navegação, disposição e UX e preservar funcionamento.

## Nova diretriz permanente

Operar como um time completo por meio de `docs/JARVIS_ENGINEERING_SYSTEM.md`. Antes de novas evoluções, tratar falhas P0 confirmadas de Socket.IO, multi-tenancy e sessões WhatsApp.

## Feedback 1.7

- Remover rail com letras e submenu semelhante ao Whaticket.
- Criar menu único com ícones e subgrupos.
- Remover barra inferior mobile.
- Corrigir tela branca recorrente.
- Criar observabilidade para erros reais do navegador.

## Resultado esperado

- Nova fundação visual aplicada globalmente.
- Novo shell, menu e topbar responsivos.
- Páginas públicas e componentes transversais padronizados.
- Dashboard com composição operacional própria.
- Comportamentos existentes preservados.
- Build, deploy e smoke aprovados em `whitelabel.usekonnex.com`.

## Riscos

- Mistura de MUI v4/v5 e centenas de estilos locais.
- Fluxos críticos de atendimento e FlowBuilder altamente acoplados.
- Ausência de suíte de regressão automatizada.

## Critérios deste lote

- Build frontend/backend aprovado.
- Login e shell renderizam.
- API, versão, rotas e permissões permanecem.
- Layout utilizável em 360, 390, 768, 1024, 1366 e 1920px.
- Modais globais possuem ações acessíveis no mobile.
- Deploy e smoke aprovados.
- Uma única região de rolagem previsível por contexto.
- Nenhuma ação some ao abrir função, modal ou teclado.
- Shell e menu não mantêm a disposição visual do Whaticket.
- Navegação organizada por espaços de trabalho e contexto.

## Resultado 1.6

- Regressões de rolagem e ações corrigidas na base.
- Shell Whaticket substituído por navegação em espaços de trabalho.
- Navegação mobile inferior e painel adaptado.
- Dashboard interno completamente reconstruído.
- Build, deploy e smoke aprovados.

## Próxima migração

Atendimento e Contatos, seguidos por Kanban, Campanhas, FlowBuilder, Conexões e Configurações. Cada módulo deve mudar composição e usabilidade, não apenas tema.

## Resultado do lote

- Fundação Konnex Signal aplicada globalmente.
- Novo shell, sidebar, topbar e contexto de página implantados.
- Login, cadastro e recuperação reconstruídos.
- Componentes transversais e diálogos responsivos atualizados.
- Capturas reais validadas em 1440×900 e 390×844.
- Build e smoke aprovados na versão 1.5.

## Resultado 1.7

- Menu único implantado em desktop e mobile.
- Barra inferior e rail de letras removidos.
- Tela branca causada por corrida do socket corrigida.
- Error Boundary e telemetria sanitizada implantados.
- Configurações públicas, favicon e avatar corrigidos.
- Build, deploy, smoke e navegador autenticado aprovados.

## Resultado 1.8

- JWT, namespace e IDs Socket.IO padronizados.
- Namespace vinculado ao `companyId` assinado.
- Sala de ticket autorizada por ticket e empresa.
- Frontend envia token por `auth` e limpa/recria conexão por identidade.
- 8/8 testes aprovados.
- Prova runtime publicada rejeitou namespace estrangeiro.
- QA desktop/mobile e smoke aprovados.

## Próximo passo

Implementar `REL-002/003` com lease Redis, fencing/CAS e registry completo de
disposers. Preparar uma conta canário isolada antes de validar pareamento,
texto, mídia, queda de rede, restart e logout.

Fora deste lote:

- lease distribuído + fencing/CAS;
- registry de disposers completo;
- shutdown explícito de Bull, Sequelize e Redis;
- manifesto atômico de auth state;
- máquina de estados completa e canário WhatsApp real.

Ao iniciar uma tarefa, registrar:

- pedido do usuário;
- resultado observável esperado;
- componentes afetados;
- riscos;
- critérios de aceite;
- plano de validação;
- estado e próximo passo.

Ao concluir, mover o resumo para o README da subversão e restaurar este arquivo para “aguardando”.
