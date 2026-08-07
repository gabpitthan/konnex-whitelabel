# Estado persistente — Whitelabel Whaticket

Última atualização: 2026-08-03
Versão ativa: `1.31`, publicada.

Este arquivo é o índice canônico. O estado curto de retomada está em `docs/project/CURRENT.md`; o histórico está no `CHANGELOG.md` e nos READMEs de versão.

## Objetivo

Modernizar e desenvolver a plataforma whitelabel de atendimento com WhatsApp e FlowBuilder, preservando multiempresa e isolamento dos demais projetos do servidor.

## Operação

- Código: `/root/whitelabel-whaticket`
- Painel: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Frontend local: `127.0.0.1:8090`
- Backend local: `127.0.0.1:3007`
- Compose: `compose.yaml`
- PostgreSQL, Redis, rede e volumes são exclusivos.
- Credenciais ficam em arquivos ignorados. Nunca copiá-las para memória, Git ou logs.

## Estado validado

- Frontend e backend compilam em Docker.
- Login e persistência administrativa foram validados.
- FlowBuilder autenticado responde.
- Versão 1.3 foi implantada e `/version` respondeu corretamente.
- Baileys oficial 6.7.22 gera QR.
- Validação completa de pareamento, mensagens, mídia e reconexão ainda depende de teste real.
- A 1.11 foi implantada com lease Redis, fencing PostgreSQL e CAS do
  lifecycle/auth state. O modo cluster permanece bloqueado até o fence alcançar
  as transações de tickets, mensagens, contatos e contadores.
- Migration, versão, smoke e restart coordenado foram aprovados; o fechamento
  de recursos após `SIGTERM` levou 1 ms.
- A 1.12 removeu pools ad hoc e SQL interpolado, adicionou readiness e reduziu
  conexões ociosas da aplicação de 6 para 1.
- A 1.13 tornou `Message` idempotente por tenant e transacional. O primeiro
  rollout encontrou dependência de constraint e foi recuperado sem mudança de
  dados; a migration corrigida, readiness e smoke foram aprovados.
- A 1.14 eliminou nos arquivos ativos as buscas de Message por `wid` sem
  `companyId`, inclusive quoted messages, ACK direto/Bull e deleção. Os 48
  testes, builds, smoke e restart foram aprovados.
- A 1.15 moveu a validação do fence para a transação que bloqueia a conexão e
  o Ticket, gravando `Ticket.lastMessage/status + Message` em um único commit e
  emitindo Message somente após commit. O gate passou com 53 testes.
- A 1.16 colocou criação de Contact/contexto de Ticket sob o fence, tornou o
  contador de não lidas atômico no PostgreSQL e impôs unicidade parcial para
  Ticket WhatsApp ativo. Backup/restore, migration, 62 testes e deploy passaram.
- A 1.17–1.21 vinculou a API externa ao tenant, adicionou rate limit Redis,
  removeu exposição de tokens, adotou digest revogável e mediu migração legada.
- A 1.22 habilitou `pg_stat_statements` sem texto SQL/PII. A janela até
  2026-08-02 mantém cache hit 99,9951%, zero locks/deadlocks/temp spill e não
  justifica índice, cache ou aumento de pool.
- A 1.23 removeu mounts duplicados e restringiu o webhook social a `/webhook`.
- A 1.24 fixou Axios backend 1.18.0 com tag/proveniência verificadas,
  centralizou integrações externas com budgets e redaction, passou em 37
  suítes/124 testes, builds, deploy e smoke da versão.
- A 1.25 bloqueou SSRF e DNS rebinding em URLs não confiáveis, validando todos
  os A/AAAA no Agent, fixando o IP aprovado ao socket e desativando redirects,
  proxy e socket path. Passou em 38 suítes/157 testes, builds, deploy, smoke e
  falha controlada sem dados sensíveis no log.
- A 1.26 fez handlers Bull propagarem falhas, adicionou DLQ/retenção limitada,
  telemetria sem payload e shutdown explícito. O runtime também revelou e
  corrigiu conexões ACK vazias quando desabilitadas. Gate 40/168, build final,
  DLQ induzida, API 1.26, smoke e restart em 538 ms foram aprovados.
- A 1.27 tornou o claim de agendamento concorrente e tenant-aware no
  PostgreSQL, removeu snapshot de cliente do Redis e impede execução paralela
  por compare-and-set. Backup/restore, 46 suítes/178 testes, builds, migration
  em 170 ms, produção 1.27, CAS 1/2, smoke e restart foram aprovados.
- A 1.28 torna CampaignShipping tenant-aware e usa uma máquina de estados com
  UUID/CAS para confirmação e conteúdo. Backup 0600, restore up/down/up,
  concorrência 1/0, 52 suítes/197 testes e builds passaram. As migrations de
  estado/FK/índice aplicaram em 162/51/57 ms; smoke e restart em 557 ms passaram. Crash
  pós-efeito permanece ambíguo e não recebe retry automático.
  Preparação/disparo usam consultas leves e não recarregam a lista inteira por
  destinatário; relações de campanha são validadas no tenant autenticado.
- A 1.29 cria reconciliação humana para Schedule/CampaignShipping
  presos após início do efeito externo. A decisão exige admin atual, tenant,
  UUID CAS e justificativa; estado e auditoria são gravados juntos. O primeiro
  laboratório detectou perda de microssegundos no timestamp via JSON, e a UUID
  corrigida produziu 1 sucesso/1 conflito sob dois reconciliadores.
- Gate 57/212, builds, migration produção em 191 ms e E2E autenticado
  reconhecer→auditar passaram. Desktop/mobile não tiveram overflow nem erros;
  restart fechou seis filas em 542 ms e voltou saudável, sem migration pendente.
- O único repositório público da conta é
  `https://github.com/gabpitthan/konnex-whitelabel`; credenciais GitHub ficam
  fora do projeto em armazenamento local 0600.
- A 1.30 remove o Bull Board 0.5.0 dormente e o Basic Auth exclusivo dele. O
  baseline de produção confirmou painel/ACK/credenciais desativados; audit
  runtime caiu de 76/9 críticas para 72/7 críticas sem tocar no Bull.
- Gate 58/214 e builds passaram. Produção confirmou `/admin/queues` 404,
  pacotes vulneráveis ausentes, smoke 1.30, shutdown de filas e retorno
  saudável sem migrations pendentes.
- A 1.31 troca o `request` sem suporte no webhook configurável por tenant pelo
  cliente HTTP já protegido contra SSRF/DNS rebinding e com budgets. Falhas
  agora são aguardadas; `request`, `form-data` 2.x e `tough-cookie` 2.x saem do
  grafo, reduzindo o audit runtime de 72/7 críticas para 68/5. Testes
  focados/build, gate 59/217, deploy, smoke e restart passaram. A imagem
  runtime mediu 67/4 críticas e o shutdown fechou seis filas em 542 ms.

## Memória estruturada

- Handoff atual: `docs/project/CURRENT.md`
- Roadmap: `docs/project/ROADMAP.md`
- Problemas abertos: `docs/project/ISSUES.md`
- Matriz de testes: `docs/project/TEST_MATRIX.md`
- Arquitetura: `docs/project/ARCHITECTURE.md`
- Operação: `docs/project/RUNBOOK.md`
- Workflow Codex: `docs/DEVELOPMENT_WORKFLOW.md`
- Sistema Jarvis: `docs/JARVIS_ENGINEERING_SYSTEM.md`
- Pesquisa Whaticket/Baileys: `docs/research/WHATICKET_RELIABILITY_2026.md`
- Backlog de confiabilidade: `docs/project/RELIABILITY_BACKLOG.md`
- Definição de pronto: `docs/DEFINITION_OF_DONE.md`
- Tarefa ativa: `tasks/ACTIVE.md`
- Decisões: `docs/decisions/`
- Histórico: `CHANGELOG.md` e `docs/versions/`

## Governança

- Regras permanentes: `AGENTS.md`.
- Fonte da versão: `VERSION`.
- Cada lote funcional incrementa uma subversão e sincroniza frontend/backend.
- Cada subversão tem `docs/versions/X.Y/README.md`.
- Snapshot só é criado quando o usuário declarar a versão pronta.
- Snapshots ficam em `/root/whitelabel-whaticket-versions/versao-X.Y/`.
- Segredos, bancos, uploads, logs e certificados privados nunca entram no snapshot.

## Continuidade

Toda nova sessão deve ler `AGENTS.md`, este índice e `docs/project/CURRENT.md`. Toda entrega relevante deve atualizar apenas as fontes afetadas, removendo estados obsoletos em vez de acumular contradições.

## Prioridade de engenharia atual

Antes de continuar o redesign, executar o P0 de confiabilidade:

1. validar auth state v2 com conta canário, restart e mensagens;
2. criar regressão automatizada para jornadas completas de WhatsApp;
3. ampliar fencing aos caminhos auxiliares antes de liberar cluster;
4. concluir e operar a reconciliação de Schedule/Campaign em PROCESSING;
5. reduzir as demais vulnerabilidades por família e alcance.

## Direção visual (ADR-0004, desde 2026-08-07)

A identidade **Konnex Signal** foi descontinuada. Duas tentativas (1.5 e 1.6)
produziram resultado parcial e foram rejeitadas, porque a identidade existia só
como princípios em prosa — e prosa não decide espaçamento, escala tipográfica
nem par de cores. Ver `docs/decisions/ADR-0004-identidade-ui-ux.md`.

- A identidade passa a ser derivada da skill `ui-ux-pro-max`.
- O **design system versionado** no repositório é a fonte da verdade visual;
  a skill é fonte de raciocínio, não de estilo copiado.
- **Nenhuma tela muda antes do design system existir versionado.** Redesenhar
  tela a tela sem tokens comuns foi a causa do resultado parcial anterior.
- Cobertura é critério de aceite: redesign parcial é falha do lote. O inventário
  de telas precisa estar explícito e fechado antes de começar.

Restrições de execução que continuam valendo:

- Preservar lógica, APIs, sockets, autenticação, permissões, banco e rotas.
- Não migrar Material UI v4 para v5 no mesmo lote do redesign.
- Responsividade obrigatória: desktop, tablet e mobile em cada tela.
- Rolagem e ações inacessíveis são regressão crítica e bloqueiam expansão visual.
- A navegação em duas camadas da 1.6 foi rejeitada; a barra inferior mobile
  também. Ambas as rejeições continuam válidas como restrição de UX.
- Tela branca deve sempre apresentar fallback recuperável e gerar erro
  observável no backend.
