# Estado persistente — Whitelabel Whaticket

Última atualização: 2026-07-28
Versão ativa: `1.7`, em desenvolvimento.

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

1. corrigir contrato JWT/IDs/namespace do Socket.IO;
2. comprovar isolamento tenant A/B nas salas;
3. fortalecer auth state e ciclo de vida Baileys;
4. criar regressão automatizada para jornadas de socket e WhatsApp.

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
