# Estado persistente — Whitelabel Whaticket

Última atualização: 2026-07-28
Versão ativa: `1.4`, em desenvolvimento.

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
