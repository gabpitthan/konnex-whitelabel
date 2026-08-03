# Estado persistente — Whitelabel Whaticket

Última atualização: 2026-08-02
Versão ativa: `1.27`, publicada.

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
4. proteger URLs configuráveis contra SSRF/DNS rebinding;
5. reduzir as demais vulnerabilidades por família e alcance.

## Direção visual aprovada

- Identidade: **Konnex Signal**.
- Reformulação integral, não apenas cores.
- Linguagem editorial, operacional e própria, baseada em conexão, fluxo, contexto e ação.
- Evitar estética genérica de IA: gradientes roxo/azul, excesso de cards, glassmorphism, pills e ícones decorativos.
- Responsividade é obrigatória em cada componente.
- Preservar lógica, APIs, sockets, autenticação, permissões, banco e rotas durante o redesign.
- A versão 1.5 foi considerada insuficiente: limpa, porém ainda estruturalmente semelhante ao Whaticket.
- A meta é um novo CRM com arquitetura de informação, navegação e experiência próprias.
- Rolagem e ações inacessíveis são regressões críticas e devem ser corrigidas antes da expansão visual.
- A navegação 1.6 em duas camadas foi rejeitada. O padrão novo é um menu único com ícones e subgrupos.
- A barra inferior mobile foi rejeitada e deve ser removida.
- Tela branca deve sempre apresentar fallback recuperável e gerar erro observável no backend.
