# Relatório de qualidade — 1.12

## Pesquisa e baseline

Fontes, medições, decisões e alternativas estão em
`docs/research/SCALABILITY_PERFORMANCE_INTEGRITY_2026.md`.

## Gate

- preflight: aprovado;
- TypeScript/backend: aprovado;
- P0: 11 suítes, 44 testes, todos aprovados;
- build backend/frontend: aprovado;
- liveness: aprovado;
- readiness PostgreSQL/Redis/drain: aprovado e falha fechada em teste;
- healthchecks Docker: backend/frontend saudáveis;
- smoke: frontend ativo e API 1.12;
- restart: `SIGTERM`, recursos fechados em 2 ms, readiness e smoke recuperados;
- migration: nenhuma;
- `git diff --check`: aprovado;
- varredura de padrões sensíveis em todo o histórico: limpa.

## Resultado operacional

- conexões ociosas da aplicação antes: 6;
- após pool único + `min=0` + idle 10 s: 1;
- redução observada: 83%;
- Redis: 2,20 MB usados, zero evictions, zero conexões rejeitadas,
  `noeviction`, AOF `everysec`;
- nenhum índice especulativo foi criado.

## Autoavaliação

| Dimensão | Nota (0–2) | Evidência |
|---|---:|---|
| Corretude | 2 | binds, datas e retorno de count testados |
| Dados | 2 | sem migration; SQL tenant-aware |
| Auth/tenant | 1 | serviços escopados; token API global permanece |
| Runtime | 2 | health, versão, Docker e smoke |
| Rollback | 2 | imagem 1.11 e reversão de duas variáveis |
| Observabilidade | 1 | readiness e baseline; sem séries/SLO |

Conclusão permitida com limitações explícitas. O próximo P0 é vincular tokens
de API ao tenant e propagar fencing às transações de domínio.
