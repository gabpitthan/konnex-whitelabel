# Whitelabel Whaticket — versão 1.21

Data: 2026-07-31
Estado: publicada

## Objetivo

Medir a migração de credenciais legadas para digest sem persistir segredo, sem
criar uma escrita adicional por request e sem declarar o contract seguro antes
de evidência suficiente.

## Pesquisa primária

- OWASP Logging Cheat Sheet:
  https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Prometheus instrumentation:
  https://prometheus.io/docs/practices/instrumentation/
- Prometheus naming/cardinality:
  https://prometheus.io/docs/practices/naming/
- PostgreSQL 17, modifying tables:
  https://www.postgresql.org/docs/17/ddl-alter.html
- PostgreSQL 17, `ALTER TABLE`:
  https://www.postgresql.org/docs/17/sql-altertable.html

## Decisão

- propagar apenas `credentialKind = legacy|digest` no contexto autenticado;
- incrementar os dois contadores no UPSERT diário já existente;
- não somar telemetria a `UsedOnDay`, preservando faturamento/uso;
- nunca gravar token, prefixo, digest, usuário ou outra dimensão cardinal;
- relatório somente para admin e sempre escopado por `companyId`;
- considerar contract pronto somente com:
  - pelo menos 30 dias desde a primeira observação;
  - algum uso digest nos últimos 30 dias;
  - zero uso legado nos últimos 30 dias;
  - zero credenciais legadas ainda ativas.

## Banco e desempenho

São adicionadas duas colunas `INTEGER NOT NULL DEFAULT 0`. O PostgreSQL 11+
mantém default constante nos metadados sem reescrever a tabela. A base medida
possui zero linhas em `ApiUsages` e relação total de 24 KiB; mesmo assim haverá
backup, restore e ensaio `up → down → up`.

## Escopo adicional encontrado pelo smoke

Os endpoints de envio comum e imagem ainda chamavam `.replace` antes da
validação. Ambos passam a reutilizar a normalização segura introduzida na 1.20,
evitando novo caminho de TypeError 500.

## Rollback

Imagem 1.20. O down remove somente os dois contadores; autenticação e credencial
continuam compatíveis.

## Evidência de publicação

- backup: `pre-1.21-20260731.dump`, modo `0600`;
- SHA-256:
  `c9dfb94a7231071d48e4261992a0da2951920945ab36d846ff7de9fdf27e4f7f`;
- restore: `up → down → up`, 31–42 ms;
- testes: 33 suítes/113 testes;
- builds Docker: backend e frontend aprovados;
- produção: migration em 92 ms, duas colunas com default zero/not-null;
- relatório admin: 200, um legado ativo, readiness falso;
- runtime: API 1.21, frontend 200, restart/shutdown em 2 ms.
