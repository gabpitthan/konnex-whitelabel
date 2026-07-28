# Whitelabel Whaticket — versão 1.2

Data: 2026-07-28  
Estado: governança concluída

## Objetivo

Implantar memória persistente, versionamento incremental e snapshots reproduzíveis para o desenvolvimento contínuo.

## Entregas

- Versão canônica no arquivo `VERSION`.
- Regras permanentes em `AGENTS.md`.
- Histórico técnico em `CHANGELOG.md`.
- Política em `docs/VERSIONING.md`.
- Memória operacional em `PROJECT_STATE.md`.
- Script de snapshot completo e verificável.
- Configuração do Codex para novas sessões sem solicitações de aprovação.

## Processo definido

- Cada lote funcional incrementa uma subversão.
- O número principal muda somente após aprovação explícita do usuário.
- Snapshots são gerados apenas de commits limpos.
- Segredos e dados operacionais não entram nos snapshots.

## Validação

- Script validado sintaticamente.
- Proteção contra snapshot de worktree sujo validada.
- Commit de governança criado.
