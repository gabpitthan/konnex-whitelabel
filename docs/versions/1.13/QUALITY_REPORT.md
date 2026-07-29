# Relatório de qualidade — 1.13

## Gate

- preflight: aprovado;
- TypeScript/backend: aprovado;
- 12 suítes, 47 testes: aprovados;
- build backend/frontend: aprovado;
- duplicidades pré-migration: zero;
- backup protegido e restaurado em banco temporário;
- migration final: 74 ms;
- constraint tenant-aware e zero duplicidades confirmadas;
- readiness e smoke API 1.13: aprovados.
- restart final: recursos fechados em 2 ms; recuperação sem migration pendente.

## Incidente e correção

A inspeção inicial identificou `Messages_id_key` e a primary key como índices
equivalentes, mas não verificou dependências de foreign keys. PostgreSQL
recusou o drop e o backend reiniciou repetidamente. A falha ocorreu antes de
alterar o schema ou registrar a migration.

A imagem foi corrigida para preservar a constraint, depois catálogo,
duplicidades, readiness e smoke foram revalidados. Regra permanente: antes de
remover constraints, inspecionar dependências, não apenas índices.

## Autoavaliação

| Dimensão | Nota (0–2) | Evidência |
|---|---:|---|
| Corretude | 2 | idempotência/rollback/emissão testados |
| Dados | 2 | backup+restore, constraint e zero duplicidade |
| Auth/tenant | 2 | unicidade composta inclui companyId |
| Runtime | 1 | recuperado e saudável; houve restart loop |
| Rollback | 2 | dump restaurado e migration down definida |
| Observabilidade | 1 | falha visível; duração indisponível imprecisa |

Entrega publicada com o incidente explicitamente registrado.
